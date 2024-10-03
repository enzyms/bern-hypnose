// initWorker.js

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
    Clock,
    Vector2
} from 'three';
import { gsap } from 'gsap';
import createReflectiveMaterial from './reflectiveMaterial';
import createBackgroundShaderMaterial from './backgroundShader';

let scene,
    camera,
    renderer,
    diamonds = [];
let shaderMaterial, renderTarget;
let backgroundScene, backgroundCamera;
let clock;
let isRendering = false;

console.log('Worker initialized');

self.onmessage = function (event) {
    const { action } = event.data;

    switch (action) {
        case 'init':
            initializeScene(event.data);
            console.log('Scene initialized');
            break;
        case 'resume':
            isRendering = true;
            if (scene && renderer) render();
            break;
        case 'stop':
            isRendering = false;
            break;
        case 'resize':
            onWindowResize(event.data.width, event.data.height);
            break;
    }
};

function initializeScene({ canvas, width, height }) {
    // Main Scene & Camera
    scene = new Scene();
    camera = new PerspectiveCamera(30, width / height, 0.1, 1000);
    camera.position.z = 50;

    // Renderer using OffscreenCanvas
    renderer = new WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background

    // Render Target
    renderTarget = new WebGLRenderTarget(width, height);

    // Background Scene and Camera
    backgroundScene = new Scene();
    backgroundCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Use the imported Shader Material
    shaderMaterial = createBackgroundShaderMaterial();

    // Ensure the shader has the necessary uniforms
    if (shaderMaterial.uniforms.u_time === undefined) {
        shaderMaterial.uniforms.u_time = { value: 0 };
    }
    if (shaderMaterial.uniforms.u_resolution === undefined) {
        shaderMaterial.uniforms.u_resolution = { value: new Vector2(width, height) };
    }

    // Fullscreen Quad for the Background
    const planeGeometry = new PlaneGeometry(2, 2);
    const backgroundMesh = new Mesh(planeGeometry, shaderMaterial);
    backgroundScene.add(backgroundMesh);

    // Create a Clock instance
    clock = new Clock();

    // Reflective Diamonds
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
        isRendering = true;
        render();

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

function onWindowResize(width, height) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

    // Update render target size
    renderTarget.setSize(width, height);

    // Update shader resolution uniform
    if (shaderMaterial.uniforms.u_resolution) {
        shaderMaterial.uniforms.u_resolution.value.set(width, height);
    }
}

// Polyfill for requestAnimationFrame in workers
if (typeof self.requestAnimationFrame !== 'function') {
    self.requestAnimationFrame = function (callback) {
        return setTimeout(() => callback(Date.now()), 1000 / 60);
    };
}
