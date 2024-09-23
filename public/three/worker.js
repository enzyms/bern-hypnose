// initWorker.js

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import { gsap } from '/three/gsap/all.js';
import createReflectiveMaterial from '/three/reflectiveMaterial.js';
import createBackgroundShaderMaterial from '/three/backgroundShader.js';

let scene,
    camera,
    renderer,
    diamonds = [];
let shaderMaterial, renderTarget;
let backgroundScene, backgroundCamera;
let clock;
let isRendering = false;

addEventListener('message', function (event) {
    const { action } = event.data;
    console.log('Worker received action:', action);
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
        case 'resize':
            onWindowResize(event.data.width, event.data.height);
            break;
    }
});

async function initializeScene(data) {
    const { canvas, width, height } = data;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    camera.position.z = 50;

    console.log('Scene initialized wdfw', canvas, width, height);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0); // Transparent background

    // // Render Target
    renderTarget = new THREE.WebGLRenderTarget(width, height);

    // // Background Scene and Camera
    backgroundScene = new THREE.Scene();
    backgroundCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // // Use the imported Shader Material
    shaderMaterial = createBackgroundShaderMaterial(THREE, width, height);
    console.log('Shader Material', shaderMaterial);
    // Ensure the shader has the necessary uniforms
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
    createReflectiveMaterial(function (reflectiveMaterial) {
        const geometry1 = new THREE.DodecahedronGeometry(5);
        const geometry2 = new THREE.IcosahedronGeometry(5);

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
            const diamond = new THREE.Mesh(data.geometry, reflectiveMaterial);
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
            console.log('Diamond', diamond);
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
