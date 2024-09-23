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
let clock = new Clock();
let isRendering = false;
console.log('Worker initialized YAY');

self.onmessage = async function (event) {
    const { action } = event.data;

    switch (action) {
        case 'init':
            await initializeScene(event.data);
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

async function initializeScene({ width, height }) {
    // Main Scene & Camera
    scene = new Scene();
    camera = new PerspectiveCamera(30, width / height, 0.1, 1000);
    camera.position.z = 50;

    // Renderer
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background

    // Render Target
    renderTarget = new WebGLRenderTarget(width, height);

    // Background Scene and Camera
    backgroundScene = new Scene();
    backgroundCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Background Shader Material
    shaderMaterial = createBackgroundShaderMaterial();

    // Fullscreen Quad for the Background
    const planeGeometry = new PlaneGeometry(2, 2);
    const backgroundMesh = new Mesh(planeGeometry, shaderMaterial);
    backgroundScene.add(backgroundMesh);

    // Reflective Diamonds
    createReflectiveMaterial((reflectiveMaterial) => {
        const geometry1 = new DodecahedronGeometry(5);
        const geometry2 = new IcosahedronGeometry(5);

        const diamondsData = [
            // diamonds positions...
        ];

        diamondsData.forEach((data) => {
            const diamond = new Mesh(data.geometry, reflectiveMaterial);
            diamond.position.set(data.x0, data.y0, data.z0);
            diamond.rotationRatioX = data.rotationRatioX;
            diamond.rotationRatioY = data.rotationRatioY;
            scene.add(diamond);
            diamonds.push(diamond);
        });

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

    isRendering = true;
    render();
}

function render() {
    if (!isRendering) return;

    requestAnimationFrame(render);

    // Update shader time
    const delta = clock.getDelta();
    shaderMaterial.uniforms.u_time.value += delta;

    // Render the background to the render target
    renderer.setRenderTarget(renderTarget);
    renderer.render(backgroundScene, backgroundCamera);
    renderer.setRenderTarget(null);

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

function onWindowResize(width, height) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderTarget.setSize(width, height);

    // Update shader resolution
    shaderMaterial.uniforms.u_resolution.value.set(width, height);
}
