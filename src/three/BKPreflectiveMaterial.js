import { TextureLoader, CubeTextureLoader, RepeatWrapping, MeshStandardMaterial } from 'three';

export default function createReflectiveMaterial(onMaterialReady) {
    const textureLoader = new TextureLoader();
    const cubeTextureLoader = new CubeTextureLoader();

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

            albedoTexture.wrapS = RepeatWrapping;
            albedoTexture.wrapT = RepeatWrapping;
            albedoTexture.repeat.set(1, 1);

            // Create the reflective material
            const reflectiveMaterial = new MeshStandardMaterial({
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
            '/three/environnement/posx.avif',
            '/three/environnement/negx.avif',
            '/three/environnement/posy.avif',
            '/three/environnement/negy.avif',
            '/three/environnement/posz.avif',
            '/three/environnement/negz.avif'
        ],
        checkIfTexturesLoaded, // onLoad callback
        undefined, // onProgress callback
        function (error) {
            console.error('An error occurred loading the environment map:', error);
        }
    );
}
