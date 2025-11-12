// initWorker.js

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.min.js';
import { gsap } from '/three/gsap/gsap-core-compressed.js';
import createReflectiveMaterial from '/three/reflectiveMaterial.js';
import createBackgroundShaderMaterial from '/three/backgroundShader.js';

let scene,
    camera,
    renderer,
    diamonds = [],
    diamondsData = [];
let shaderMaterial, renderTarget;
let backgroundScene, backgroundCamera;
let clock;
let isRendering = false;

addEventListener('message', function (event) {
    const { action } = event.data;

    switch (action) {
        case 'init':
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

    // Create a Clock instance
    clock = new THREE.Clock();

    // Reflective Diamonds
    createReflectiveMaterial((reflectiveMaterial) => {
        const geometries = [new THREE.DodecahedronGeometry(5), new THREE.IcosahedronGeometry(5)];

        // Simplify diamonds data using arrays for positions and geometry
        diamondsData = [
            {
                positions: [
                    [8, -10, 35],
                    [8, -5, 35],
                    [16, 5, 12],
                    [20, -5, 35]
                ],
                geometry: geometries[0],
                rotationRatios: { x: 1, y: 1 }
            },
            {
                positions: [
                    [16, 20, -15],
                    [16, 0, -15],
                    [8, -5, 35],
                    [16, 0, 0]
                ],
                geometry: geometries[1],
                rotationRatios: { x: -2, y: -3 }
            },
            {
                positions: [
                    [20, -5, 35],
                    [16, 5, 12],
                    [16, 0, -15],
                    [16, 0, 15]
                ],
                geometry: geometries[0],
                rotationRatios: { x: 1, y: -1 }
            }
        ];

        // Helper function to create a diamond mesh
        function createDiamond({ positions, geometry, rotationRatios }) {
            const diamond = new THREE.Mesh(geometry, reflectiveMaterial);
            const [initialPos, targetPos] = positions;

            // Set initial position and rotation
            diamond.position.set(...initialPos);
            diamond.rotationRatioX = rotationRatios.x;
            diamond.rotationRatioY = rotationRatios.y;

            // Store positions for animation
            diamond.position0 = { x: initialPos[0], y: initialPos[1], z: initialPos[2] };
            diamond.position1 = { x: targetPos[0], y: targetPos[1], z: targetPos[2] };

            return diamond;
        }

        // Create diamonds and add them to the scene
        diamondsData.forEach((data) => {
            const diamond = createDiamond(data);
            scene.add(diamond);
            diamonds.push(diamond);
        });

        // Start rendering
        isRendering = true;
        render();

        // Animate diamonds using GSAP
        diamonds.forEach((diamond) => {
            gsap.to(diamond.position, {
                x: diamond.position1.x,
                y: diamond.position1.y,
                z: diamond.position1.z,
                duration: 5,
                ease: 'power5.out'
            });
        });
    }, THREE);
}

function render() {
    if (!isRendering) return;

    // Update the uniform for time in the shader
    const delta = clock.getDelta();
    shaderMaterial.uniforms.u_time.value += delta;

    // Render the background scene to the render target
    renderer.setRenderTarget(renderTarget);
    renderer.render(backgroundScene, backgroundCamera);
    renderer.setRenderTarget(null); // Ensure we're rendering to the screen again

    // Set the main scene's background to the render target's texture
    scene.background = renderTarget.texture;

    // Rotate diamonds
    diamonds.forEach((diamond) => {
        diamond.rotation.x += 0.0002 * diamond.rotationRatioX;
        diamond.rotation.y += 0.0002 * diamond.rotationRatioY;
    });

    // Render the main scene
    renderer.render(scene, camera);

    // Request the next frame
    self.requestAnimationFrame(render);
}

function animateDiamondsTo(diamondPosition) {
    // Ensure the position is within bounds (0 = first position, 1 = second position, 2 = third position)
    if (diamondPosition < 0 || diamondPosition > 5) {
        console.error('Invalid diamond position index:', diamondPosition);
        return;
    }

    // Animate all diamonds to the selected position
    diamonds.forEach((diamond, index) => {
        const targetPosition = diamondsData[index].positions[diamondPosition];

        if (targetPosition) {
            gsap.to(diamond.position, {
                x: targetPosition[0],
                y: targetPosition[1],
                z: targetPosition[2],
                duration: 5,
                ease: 'back.inOut'
            });
        }
    });
}

function onWindowResize(data) {
    const { width, height } = data;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);

    // Update render target size
    renderTarget.setSize(width, height, false);

    // Update shader resolution uniform
    if (shaderMaterial.uniforms.u_resolution) {
        shaderMaterial.uniforms.u_resolution.value.set(width, height);
    }
}
