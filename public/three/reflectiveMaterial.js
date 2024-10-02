export default function createReflectiveMaterial(onMaterialReady, THREE) {
    const { ImageBitmapLoader, RepeatWrapping, MeshStandardMaterial, Texture, CubeTexture, LinearFilter } = THREE;

    const imageBitmapLoader = new ImageBitmapLoader();

    // Variables to hold textures
    let albedoTexture;
    let envMap;

    // Array to hold environment map images
    const envMapImages = [];

    // Counter to track loaded textures
    let texturesLoaded = 0;

    // Function to check if all textures are loaded
    function checkIfTexturesLoaded() {
        texturesLoaded++;
        if (texturesLoaded === 7) {
            // All textures are loaded

            // Create the cube texture
            envMap = new CubeTexture(envMapImages);
            envMap.needsUpdate = true;
            envMap.magFilter = LinearFilter;
            envMap.minFilter = LinearFilter;

            // Set texture properties
            albedoTexture.wrapS = RepeatWrapping;
            albedoTexture.wrapT = RepeatWrapping;
            albedoTexture.repeat.set(1, 1);
            albedoTexture.needsUpdate = true;

            // Create the reflective material
            const reflectiveMaterial = new MeshStandardMaterial({
                map: albedoTexture,
                metalness: 0.1,
                roughness: 0.07,
                envMap: envMap,
                envMapIntensity: 3.0
            });

            // Call the callback function to pass back the material
            onMaterialReady(reflectiveMaterial);
        }
    }

    // Load the albedo texture
    imageBitmapLoader.load(
        '/three/texture.avif',
        function (imageBitmap) {
            albedoTexture = new Texture(imageBitmap);
            albedoTexture.needsUpdate = true;
            checkIfTexturesLoaded();
        },
        undefined,
        function (error) {
            console.error('An error occurred loading the albedo texture:', error);
        }
    );

    // Load the cube environment map faces
    const cubeUrls = [
        '/three/environnement/posx.avif',
        '/three/environnement/posx.avif',
        '/three/environnement/posy.avif',
        '/three/environnement/posy.avif',
        '/three/environnement/posz.avif',
        '/three/environnement/posz.avif'
    ];

    cubeUrls.forEach((url, index) => {
        imageBitmapLoader.load(
            url,
            function (imageBitmap) {
                envMapImages[index] = imageBitmap;
                checkIfTexturesLoaded();
            },
            undefined,
            function (error) {
                console.error('An error occurred loading the environment map texture:', error);
            }
        );
    });
}
