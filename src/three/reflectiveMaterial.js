import * as THREE from 'three';

export default function createReflectiveMaterial(onMaterialReady) {
    const textureLoader = new THREE.TextureLoader();
    const cubeTextureLoader = new THREE.CubeTextureLoader();

    // Variables to hold textures
    let albedoTexture;
    let envMap;

    // Counter to track loaded textures
    let texturesLoaded = 0;

    // Function to check if all textures are loaded
    function checkIfTexturesLoaded() {
        texturesLoaded++;
        if (texturesLoaded === 2) {
            // Both textures are loaded
            // Set texture properties
            albedoTexture.encoding = THREE.sRGBEncoding;
            albedoTexture.wrapS = THREE.RepeatWrapping;
            albedoTexture.wrapT = THREE.RepeatWrapping;
            albedoTexture.repeat.set(1, 1);

            // Create the reflective material
            const reflectiveMaterial = new THREE.MeshStandardMaterial({
                map: albedoTexture,
                metalness: 0.1,
                roughness: 0.07,
                envMap: envMap,
                envMapIntensity: 7.0
            });

            // Call the callback function to pass back the material
            onMaterialReady(reflectiveMaterial);
        }
    }

    // Load the albedo texture
    albedoTexture = textureLoader.load(
        '/three/texture.avif',
        checkIfTexturesLoaded, // onLoad callback
        undefined, // onProgress callback
        function (error) {
            console.error('An error occurred loading the albedo texture:', error);
        }
    );

    // Load the cube environment map
    envMap = cubeTextureLoader.load(
        [
            '/three/environnement/posx.png',
            '/three/environnement/negx.png',
            '/three/environnement/posy.png',
            '/three/environnement/negy.png',
            '/three/environnement/posz.png',
            '/three/environnement/negz.png'
        ],
        checkIfTexturesLoaded, // onLoad callback
        undefined, // onProgress callback
        function (error) {
            console.error('An error occurred loading the environment map:', error);
        }
    );
}
