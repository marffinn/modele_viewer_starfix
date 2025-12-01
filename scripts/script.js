// script.js
let scene, camera, renderer, controls;
let pointLight1, pointLight2, pointLight3;
let orbitRadius = 5; // Default radius

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdddddd);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // Load environment map
    const exrLoader = new THREE.EXRLoader();
    exrLoader.load('./assets/env/venetian_crossroads_1k.exr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        // scene.background = envMap; // Uncomment if you want the environment as background
        texture.dispose();
        pmremGenerator.dispose();
    });

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add flying point lights
    pointLight1 = new THREE.PointLight(0xff0000, 2, 100);
    pointLight2 = new THREE.PointLight(0x00ff00, 2, 100);
    pointLight3 = new THREE.PointLight(0x0000ff, 2, 100);
    scene.add(pointLight1, pointLight2, pointLight3);

    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Animate lights around the controls.target
    const time = performance.now() * 0.001;
    const center = controls.target;

    pointLight1.position.set(
        center.x + Math.sin(time * 0.5) * orbitRadius,
        center.y + Math.cos(time * 0.7) * orbitRadius * 0.5,
        center.z + Math.cos(time * 0.5) * orbitRadius
    );

    pointLight2.position.set(
        center.x + Math.sin(time * 0.7 + Math.PI / 3) * orbitRadius,
        center.y + Math.cos(time * 0.5 + Math.PI / 3) * orbitRadius * 0.5,
        center.z + Math.cos(time * 0.7 + Math.PI / 3) * orbitRadius
    );

    pointLight3.position.set(
        center.x + Math.sin(time * 0.3 + 2 * Math.PI / 3) * orbitRadius,
        center.y + Math.cos(time * 0.9 + 2 * Math.PI / 3) * orbitRadius * 0.5,
        center.z + Math.cos(time * 0.3 + 2 * Math.PI / 3) * orbitRadius
    );

    controls.update();
    renderer.render(scene, camera);
}

function loadModel(url) {
    $('#loadingIndicator').show();
    $('#progressText').text('0%');
    $('#progressBar').val(0);

    const loader = new THREE.GLTFLoader();
    loader.load(
        url,
        function (gltf) {
            // Remove previous models (keep lights)
            scene.children = scene.children.filter(child =>
                child.type === 'DirectionalLight' ||
                child.type === 'AmbientLight' ||
                child.type === 'PointLight'
            );

            const model = gltf.scene;
            scene.add(model);

            // Auto-center and scale the camera
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3()).length();

            controls.target.copy(center);
            camera.position.copy(center);
            camera.position.z += size * 1.5; // Adjust zoom level
            orbitRadius = size * 1.5; // Update orbit radius for lights
            controls.update();

            $('#loadingIndicator').hide();
        },
        function (xhr) {
            if (xhr.lengthComputable) {
                const percentLoaded = Math.round((xhr.loaded / xhr.total) * 100);
                $('#progressBar').val(percentLoaded);
                $('#progressText').text(percentLoaded + '%');
            }
        },
        function (error) {
            console.error('Error loading GLB:', error);
            $('#loadingIndicator').hide();
        }
    );
}

$(document).ready(function () {
    init();

    $('#model-list a').click(function (e) {
        e.preventDefault();
        const url = $(this).attr('href');
        loadModel(url);
    });
});