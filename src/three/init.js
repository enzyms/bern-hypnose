// init.js

import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Mesh,
    DodecahedronGeometry,
    IcosahedronGeometry,
    WebGLRenderTarget,
    OrthographicCamera,
    PlaneGeometry,
    Clock
} from 'three';
import { gsap } from 'gsap'; // Import GSAP
import createReflectiveMaterial from './reflectiveMaterial';
import createBackgroundShaderMaterial from './backgroundShader';

let scene,
    camera,
    renderer,
    diamonds = [];
let shaderMaterial, renderTarget;
let backgroundScene, backgroundCamera;
let clock;
const container = document.getElementById('container');

function init() {
    // Ensure the container exists
    if (!container) {
        console.error('Container element not found');
        return;
    }

    container.classList.remove('opacity-0');

    // Main Scene & Camera
    scene = new Scene();
    camera = new PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // Renderer
    renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xe9d7eb);

    renderer = new WebGLRenderer({ antialias: true, alpha: true }); // 'alpha: true' to allow transparent background
    renderer.setClearColor(0x000000, 0); // Transparent background (alpha = 0)
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    container.appendChild(renderer.domElement);

    renderTarget = new WebGLRenderTarget(window.innerWidth, window.innerHeight);

    // Background Scene and Camera
    backgroundScene = new Scene();
    backgroundCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Use the imported Shader Material
    shaderMaterial = createBackgroundShaderMaterial();

    // Fullscreen Quad for the Background
    const planeGeometry = new PlaneGeometry(2, 2);
    const backgroundMesh = new Mesh(planeGeometry, shaderMaterial);
    backgroundScene.add(backgroundMesh);

    // Handle window resizing
    window.addEventListener('resize', onWindowResize, false);

    // Create a Clock instance
    clock = new Clock();

    createReflectiveMaterial(function (reflectiveMaterial) {
        const geometry1 = new DodecahedronGeometry(5);
        const geometry2 = new IcosahedronGeometry(5);

        const diamondsData = [
            {
                x0: 8,
                y0: -10,
                z0: 35,
                x1: 8,
                y1: -5,
                z1: 35,
                geometry: geometry1,
                rotationRatioX: 1,
                rotationRatioY: 1
            },
            {
                x0: 16,
                y0: 20,
                z0: -15,
                x1: 16,
                y1: 0,
                z1: -15,
                geometry: geometry2,
                rotationRatioX: -2,
                rotationRatioY: -3
            },
            {
                x0: 20,
                y0: -5,
                z0: 35,
                x1: 16,
                y1: 5,
                z1: 12,
                geometry: geometry1,
                rotationRatioX: 1,
                rotationRatioY: -1
            }
        ];

        diamondsData.forEach((data) => {
            const diamond = new Mesh(data.geometry, reflectiveMaterial);
            diamond.position.set(data.x0, data.y0, data.z0);
            diamond.rotationRatioX = data.rotationRatioX;
            diamond.rotationRatioY = data.rotationRatioY;
            diamond.position0 = { x: data.x0, y: data.y0, z: data.z0 };
            diamond.position1 = { x: data.x1, y: data.y1, z: data.z1 };
            scene.add(diamond);
            diamonds.push(diamond);
        });

        // Start the animation loop
        animate();

        // Animate the diamonds using GSAP
        diamonds.forEach((diamond) => {
            gsap.to(diamond.position, {
                x: diamond.position1.x,
                y: diamond.position1.y,
                z: diamond.position1.z,
                duration: 5,
                ease: 'power5.out'
            });
        });
    });
}

function animate() {
    requestAnimationFrame(animate);

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
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    // Update render target size
    renderTarget.setSize(window.innerWidth, window.innerHeight);

    // Update shader resolution uniform
    shaderMaterial.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
}

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

if (isMobileDevice()) {
    const fallbackBg = document.getElementById('fallbackBg');
    fallbackBg?.classList.remove('hidden');
} else {
    const checkDocumentReadyState = () => {
        if (document.readyState === 'interactive') {
            // Optional: Do something when it's interactive (optional stage)
        }

        if (document.readyState === 'complete') {
            // After the document is fully loaded, delay initialization by an additional 200ms
            setTimeout(() => {
                init(); // Initialize the Three.js scene
            }, 200);
        } else {
            // Keep checking until the document state is "complete"
            document.addEventListener('readystatechange', checkDocumentReadyState);
        }
    };

    // Start checking the document state after DOMContentLoaded event
    document.addEventListener('DOMContentLoaded', checkDocumentReadyState);
}
