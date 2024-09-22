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
import createReflectiveMaterial from './reflectiveMaterial';
import createBackgroundShaderMaterial from './backgroundShader';

let scene,
    camera,
    renderer,
    diamonds = [];
let shaderMaterial, renderTarget;
let backgroundScene, backgroundCamera;
let clock;

init();

function init() {
    const container = document.getElementById('container');

    // Main Scene & Camera
    scene = new Scene();
    camera = new PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;
    camera.rotation.y = 0; // 0.3;
    // Renderer
    renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setClearColor(0xe9d7eb);

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

    // Create the reflective material and diamonds asynchronously
    createReflectiveMaterial(function (reflectiveMaterial) {
        // Create Three diamonds using the advanced reflective material
        const geometry1 = new DodecahedronGeometry(5);
        const geometry2 = new IcosahedronGeometry(5);

        const diamondsData = [
            { x: 7, y: -5, z: 35, geometry: geometry1, rotationRatioX: 1, rotationRatioY: 1 },
            { x: 15, y: 0, z: -15, geometry: geometry2, rotationRatioX: -1, rotationRatioY: -1 },
            { x: 18, y: 5, z: 12, geometry: geometry1, rotationRatioX: 1, rotationRatioY: -1 }
        ];

        diamondsData.forEach((pos) => {
            const diamond = new Mesh(pos.geometry, reflectiveMaterial);
            diamond.position.set(pos.x, pos.y, pos.z);
            diamond.rotationRatioX = pos.rotationRatioX;
            diamond.rotationRatioY = pos.rotationRatioY;
            scene.add(diamond);
            diamonds.push(diamond);
        });

        animate();
    });
}

function animate() {
    requestAnimationFrame(animate);

    // Update the uniform for time in the shader
    shaderMaterial.uniforms.u_time.value += clock.getDelta();

    // Render the background scene to the render target
    renderer.setRenderTarget(renderTarget);
    renderer.render(backgroundScene, backgroundCamera);
    renderer.setRenderTarget(null); // Ensure we're rendering to the screen again

    // Set the main scene's background to the render target's texture
    scene.background = renderTarget.texture;

    // Rotate
    diamonds.forEach((diamond) => {
        diamond.rotation.x += 0.001 * diamond.rotationRatioX;
        diamond.rotation.y += 0.001 * diamond.rotationRatioY;
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
