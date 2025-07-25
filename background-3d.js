/* Live 3D Background powered by Three.js
   This script creates a subtle rotating starfield that sits behind
   the main résumé content.  The canvas is transparent and non-interactive
   so it won’t interfere with page clicks or touch events. */

(function () {
  // Bail out if THREE is unavailable (e.g., script failed to load)
  if (typeof THREE === 'undefined') return;

  // Create scene, camera, renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 1;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.id = 'bg3d';
  renderer.domElement.style.pointerEvents = 'none'; // Don’t block UI

  // Insert canvas as the first element in <body>
  document.body.prepend(renderer.domElement);

  // Generate starfield
  const STAR_COUNT = 5000;
  const positions = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const starMaterial = new THREE.PointsMaterial({ color: 0x00ff00,
    size: 2,
    sizeAttenuation: false,
    blending: THREE.AdditiveBlending,
    depthWrite: false });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Handle window resize
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    stars.rotation.x += 0.0005;
    stars.rotation.y += 0.0005;
    renderer.render(scene, camera);
  }
  animate();
})();