// Three.js background worker (OffscreenCanvas): pastel shader gradient,
// three reflective gems with per-visit personality, idle drift, occasional
// rotation flourishes, pointer-proximity reactions and a subtle sparkle layer.
// Served verbatim (no bundler) — keep it plain ES modules.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.min.js';
import { gsap } from '/three/gsap/gsap-core-compressed.js';
import createReflectiveMaterial from '/three/reflectiveMaterial.js';
import createBackgroundShaderMaterial from '/three/backgroundShader.js';

// ── Tuning ──────────────────────────────────────────────────────────────
const GEM_RADIUS = 5;
const BASE_ROT_SPEED = 0.0002;
const JITTER = { xy: 2, z: 4 }; // per-visit position personality
const DRIFT = { ampMin: 0.3, ampMax: 0.8, periodMin: 7, periodMax: 14 }; // idle breathing
const FLOURISH = { minDelay: 20000, maxDelay: 40000, rotBoost: 25, half: 3.5 }; // rare graceful spins
const HOVER = { radiusFactor: 1.35, scale: 1.12, rotBoost: 8, inDur: 0.7, outDur: 1.4 };
const SPARKLE = {
    count: 48,
    box: { x: [2, 26], y: [-16, 22], z: [-18, 38] },
    color: 0xfff3d6,
    baseAlpha: 0.1,
    twinkleAlpha: 0.3,
    hoverAlpha: 0.25
};

const TAN_HALF_FOV = Math.tan((15 * Math.PI) / 180); // camera FOV 30

let scene,
    camera,
    renderer,
    diamonds = [],
    diamondsData = [];
let shaderMaterial, renderTarget;
let backgroundScene, backgroundCamera;
let clock;
let isRendering = false;
let elapsed = 0;
let reducedMotion = false;

const pointer = { x: 0, y: 0, active: false };
let hoveredGem = null;
let flourishTimer = null;
let sparkleUniforms = null;

const rand = (min, max) => min + Math.random() * (max - min);

addEventListener('message', function (event) {
    const { action } = event.data;

    switch (action) {
        case 'init':
            reducedMotion = !!event.data.reducedMotion;
            initializeScene(event.data);
            break;
        case 'resume':
            isRendering = true;
            if (scene && renderer) render();
            break;
        case 'stop':
            isRendering = false;
            break;
        case 'animate':
            animateDiamondsTo(event.data.diamondPosition);
            break;
        case 'pointer':
            if (event.data.x == null) {
                pointer.active = false;
            } else {
                pointer.x = event.data.x;
                pointer.y = event.data.y;
                pointer.active = true;
            }
            break;
        case 'motionPref':
            setReducedMotion(!!event.data.reduced);
            break;
        case 'flourish':
            doFlourish();
            break;
        case 'resize':
            onWindowResize(event.data);
            break;
    }
});

async function initializeScene(data) {
    const { canvas, width, height } = data;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    camera.position.z = 50;

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0); // Transparent background

    // Render Target
    renderTarget = new THREE.WebGLRenderTarget(width, height);

    // Background Scene and Camera
    backgroundScene = new THREE.Scene();
    backgroundCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Use the imported Shader Material
    shaderMaterial = createBackgroundShaderMaterial(THREE, width, height);

    if (shaderMaterial.uniforms.u_time === undefined) {
        shaderMaterial.uniforms.u_time = { value: 0 };
    }
    if (shaderMaterial.uniforms.u_resolution === undefined) {
        shaderMaterial.uniforms.u_resolution = {
            value: new THREE.Vector2(width, height)
        };
    }

    // Fullscreen Quad for the Background
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const backgroundMesh = new THREE.Mesh(planeGeometry, shaderMaterial);
    backgroundScene.add(backgroundMesh);

    clock = new THREE.Clock();

    createSparkles();

    // Reflective Diamonds
    createReflectiveMaterial((reflectiveMaterial) => {
        const geometries = [new THREE.DodecahedronGeometry(GEM_RADIUS), new THREE.IcosahedronGeometry(GEM_RADIUS)];

        diamondsData = [
            {
                positions: [
                    [8, -10, 35],
                    [8, -5, 35],
                    [16, 5, 12],
                    [20, -5, 35],
                    [12, 8, 20],
                    [18, -8, 5]
                ],
                geometry: geometries[0],
                rotationRatios: { x: 1, y: 1 }
            },
            {
                positions: [
                    [16, 20, -15],
                    [16, 0, -15],
                    [8, -5, 35],
                    [16, 0, 0],
                    [10, 12, 25],
                    [20, 15, -5]
                ],
                geometry: geometries[1],
                rotationRatios: { x: -2, y: -3 }
            },
            {
                positions: [
                    [20, -5, 35],
                    [16, 5, 12],
                    [16, 0, -15],
                    [16, 0, 15],
                    [8, 15, 30],
                    [14, -2, -10]
                ],
                geometry: geometries[0],
                rotationRatios: { x: 1, y: -1 }
            }
        ];

        function createDiamond(data) {
            const diamond = new THREE.Mesh(data.geometry, reflectiveMaterial);
            diamond.rotationRatioX = data.rotationRatios.x;
            diamond.rotationRatioY = data.rotationRatios.y;

            // Per-visit personality: stable jitter applied to every preset
            data.jitter = { x: rand(-JITTER.xy, JITTER.xy), y: rand(-JITTER.xy, JITTER.xy), z: rand(-JITTER.z, JITTER.z) };

            const initial = presetPosition(data, 0);
            diamond.userData.basePos = { x: initial[0], y: initial[1], z: initial[2] };
            diamond.position.set(...initial);

            // Idle drift (breathing float)
            diamond.userData.drift = {
                ampX: rand(DRIFT.ampMin, DRIFT.ampMax),
                ampY: rand(DRIFT.ampMin, DRIFT.ampMax),
                spdX: (2 * Math.PI) / rand(DRIFT.periodMin, DRIFT.periodMax),
                spdY: (2 * Math.PI) / rand(DRIFT.periodMin, DRIFT.periodMax),
                phX: rand(0, 2 * Math.PI),
                phY: rand(0, 2 * Math.PI)
            };
            diamond.userData.rotBoost = 0;
            diamond.userData.flourishing = false;
            diamond.userData.hovered = false;

            return diamond;
        }

        diamondsData.forEach((data) => {
            const diamond = createDiamond(data);
            scene.add(diamond);
            diamonds.push(diamond);
        });

        isRendering = true;
        render();

        // Intro: settle onto preset 1
        diamonds.forEach((diamond, index) => {
            const target = presetPosition(diamondsData[index], 1);
            gsap.to(diamond.userData.basePos, {
                x: target[0],
                y: target[1],
                z: target[2],
                duration: 5,
                ease: 'power5.out'
            });
        });

        scheduleNextFlourish();
    }, THREE);
}

function presetPosition(data, index) {
    const preset = data.positions[index];
    const jitter = data.jitter ?? { x: 0, y: 0, z: 0 };
    return [preset[0] + jitter.x, preset[1] + jitter.y, preset[2] + jitter.z];
}

// ── Sparkles ────────────────────────────────────────────────────────────

function createSparkles() {
    const positions = new Float32Array(SPARKLE.count * 3);
    const phases = new Float32Array(SPARKLE.count);
    const speeds = new Float32Array(SPARKLE.count);
    const sizes = new Float32Array(SPARKLE.count);

    for (let i = 0; i < SPARKLE.count; i++) {
        positions[i * 3] = rand(...SPARKLE.box.x);
        positions[i * 3 + 1] = rand(...SPARKLE.box.y);
        positions[i * 3 + 2] = rand(...SPARKLE.box.z);
        phases[i] = rand(0, 2 * Math.PI);
        speeds[i] = rand(0.4, 1.2);
        sizes[i] = rand(5, 12);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    sparkleUniforms = {
        u_time: { value: 0 },
        u_timeScale: { value: reducedMotion ? 0.15 : 1 },
        u_color: { value: new THREE.Color(SPARKLE.color) },
        u_hoverPos: { value: new THREE.Vector3(0, 0, 0) },
        u_hoverStrength: { value: 0 }
    };

    const material = new THREE.ShaderMaterial({
        uniforms: sparkleUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
            uniform float u_time;
            uniform float u_timeScale;
            uniform vec3 u_hoverPos;
            uniform float u_hoverStrength;
            attribute float aPhase;
            attribute float aSpeed;
            attribute float aSize;
            varying float vAlpha;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = aSize * (30.0 / -mvPosition.z);
                float twinkle = 0.5 + 0.5 * sin(u_time * u_timeScale * aSpeed + aPhase);
                vAlpha = ${SPARKLE.baseAlpha.toFixed(2)} + ${SPARKLE.twinkleAlpha.toFixed(2)} * twinkle;
                vAlpha += u_hoverStrength * ${SPARKLE.hoverAlpha.toFixed(2)} * smoothstep(14.0, 2.0, distance(position, u_hoverPos));
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 u_color;
            varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                float alpha = vAlpha * smoothstep(0.5, 0.1, d);
                gl_FragColor = vec4(u_color, alpha);
            }
        `
    });

    scene.add(new THREE.Points(geometry, material));
}

// ── Flourishes ──────────────────────────────────────────────────────────

function scheduleNextFlourish() {
    clearTimeout(flourishTimer);
    flourishTimer = setTimeout(doFlourish, rand(FLOURISH.minDelay, FLOURISH.maxDelay));
}

function doFlourish() {
    if (reducedMotion || !diamonds.length) {
        scheduleNextFlourish();
        return;
    }
    const candidates = diamonds.filter((d) => !d.userData.flourishing && !d.userData.hovered);
    if (!candidates.length) {
        scheduleNextFlourish();
        return;
    }
    const gem = candidates[Math.floor(Math.random() * candidates.length)];
    gem.userData.flourishing = true;

    gsap.to(gem.userData, {
        rotBoost: FLOURISH.rotBoost,
        duration: FLOURISH.half,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1,
        overwrite: 'auto',
        onComplete: () => {
            gem.userData.flourishing = false;
            gem.userData.rotBoost = 0;
            scheduleNextFlourish();
        }
    });
    gsap.to(gem.scale, {
        x: 1.05,
        y: 1.05,
        z: 1.05,
        duration: FLOURISH.half,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1,
        overwrite: 'auto'
    });
}

// ── Hover (NDC proximity, no raycaster) ─────────────────────────────────

const scratch = new THREE.Vector3();

function updateHover() {
    let nearest = null;
    if (pointer.active && camera) {
        let nearestDist = Infinity;
        for (const gem of diamonds) {
            scratch.copy(gem.position).project(camera);
            const dx = (pointer.x - scratch.x) * camera.aspect;
            const dy = pointer.y - scratch.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = (GEM_RADIUS / (camera.position.z - gem.position.z)) / TAN_HALF_FOV;
            if (dist < radius * HOVER.radiusFactor && dist < nearestDist) {
                nearest = gem;
                nearestDist = dist;
            }
        }
    }
    if (nearest === hoveredGem) return;

    if (hoveredGem) {
        const gem = hoveredGem;
        gem.userData.hovered = false;
        gsap.to(gem.scale, { x: 1, y: 1, z: 1, duration: HOVER.outDur, ease: 'power2.inOut', overwrite: 'auto' });
        if (!gem.userData.flourishing) {
            gsap.to(gem.userData, { rotBoost: 0, duration: HOVER.outDur, ease: 'power2.inOut', overwrite: 'auto' });
        }
        if (sparkleUniforms) gsap.to(sparkleUniforms.u_hoverStrength, { value: 0, duration: 1, overwrite: 'auto' });
    }

    hoveredGem = nearest;

    if (hoveredGem) {
        const gem = hoveredGem;
        gem.userData.hovered = true;
        gsap.to(gem.scale, { x: HOVER.scale, y: HOVER.scale, z: HOVER.scale, duration: HOVER.inDur, ease: 'power2.out', overwrite: 'auto' });
        if (!reducedMotion && !gem.userData.flourishing) {
            gsap.to(gem.userData, { rotBoost: HOVER.rotBoost, duration: HOVER.inDur, ease: 'power2.out', overwrite: 'auto' });
        }
        if (sparkleUniforms) {
            sparkleUniforms.u_hoverPos.value.copy(gem.position);
            gsap.to(sparkleUniforms.u_hoverStrength, { value: 1, duration: 1, overwrite: 'auto' });
        }
    }
}

// ── Reduced motion ──────────────────────────────────────────────────────

function setReducedMotion(reduced) {
    reducedMotion = reduced;
    if (sparkleUniforms) sparkleUniforms.u_timeScale.value = reduced ? 0.15 : 1;
    if (reduced) {
        for (const gem of diamonds) {
            if (!gem.userData.flourishing) gem.userData.rotBoost = 0;
        }
    }
}

// ── Render loop ─────────────────────────────────────────────────────────

function render() {
    if (!isRendering) return;

    const delta = clock.getDelta();
    elapsed += delta;
    shaderMaterial.uniforms.u_time.value += delta;
    if (sparkleUniforms) sparkleUniforms.u_time.value = elapsed;

    // Render the background scene to the render target
    renderer.setRenderTarget(renderTarget);
    renderer.render(backgroundScene, backgroundCamera);
    renderer.setRenderTarget(null);
    scene.background = renderTarget.texture;

    // Compose gem transforms: base position + idle drift, rotation + boost
    for (const gem of diamonds) {
        const { basePos, drift, rotBoost } = gem.userData;
        const driftScale = reducedMotion ? 0 : 1;
        gem.position.x = basePos.x + driftScale * drift.ampX * Math.sin(elapsed * drift.spdX + drift.phX);
        gem.position.y = basePos.y + driftScale * drift.ampY * Math.sin(elapsed * drift.spdY + drift.phY);
        gem.position.z = basePos.z;
        gem.rotation.x += BASE_ROT_SPEED * gem.rotationRatioX * (1 + rotBoost);
        gem.rotation.y += BASE_ROT_SPEED * gem.rotationRatioY * (1 + rotBoost);
    }

    updateHover();

    renderer.render(scene, camera);
    self.requestAnimationFrame(render);
}

function animateDiamondsTo(diamondPosition) {
    const index = parseInt(diamondPosition, 10);
    if (Number.isNaN(index) || index < 0) {
        console.error('Invalid diamond position index:', diamondPosition);
        return;
    }

    diamonds.forEach((diamond, i) => {
        if (index >= diamondsData[i].positions.length) return;
        const target = presetPosition(diamondsData[i], index);
        gsap.to(diamond.userData.basePos, {
            x: target[0],
            y: target[1],
            z: target[2],
            duration: 5,
            ease: 'back.inOut',
            overwrite: 'auto'
        });
    });
}

function onWindowResize(data) {
    const { width, height } = data;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
    renderTarget.setSize(width, height, false);

    if (shaderMaterial.uniforms.u_resolution) {
        shaderMaterial.uniforms.u_resolution.value.set(width, height);
    }
}
