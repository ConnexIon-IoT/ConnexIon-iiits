// --- 1. Global State & Theme Control ---
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

let isDarkMode = true;

function initThemeToggle() {
  const switchBtn = document.getElementById('theme-switch');
  const icon = document.getElementById('theme-icon');

  switchBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;

    if (isDarkMode) {
      document.body.classList.remove('light-mode');
      icon.className = 'fa-solid fa-moon text-xs';
    } else {
      document.body.classList.add('light-mode');
      icon.className = 'fa-solid fa-sun text-xs';
    }

    if (ambientLight && mainLight) {
      ambientLight.intensity = isDarkMode ? 0.85 : 1.4;
      mainLight.intensity = isDarkMode ? 2.5 : 3.2;
    }
  });
}

// --- 2. Matrix Rain Effect ---
function initMatrixRain() {
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const chars = ['0', '1'];
  const fontSize = 16;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(1).map(() => Math.floor(Math.random() * -60));

  function drawMatrix() {
    ctx.fillStyle = isDarkMode ? 'rgba(3, 7, 18, 0.22)' : 'rgba(241, 245, 249, 0.28)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `700 ${fontSize}px 'JetBrains Mono', monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      const rand = Math.random();
      if (rand > 0.95) {
        ctx.fillStyle = isDarkMode ? '#ffffff' : '#0f172a';
      } else {
        ctx.fillStyle = isDarkMode ? 'rgba(56, 189, 248, 0.65)' : 'rgba(2, 132, 199, 0.85)';
      }

      ctx.fillText(text, x, y);

      if (y > canvas.height && Math.random() > 0.982) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  setInterval(drawMatrix, 60);
}

// --- 3. Cyberpunk Glitch Overlay ---
let glitchCanvas, glitchCtx;
let glitchActive = false;
let glitchStartTime = 0;
let hasGlitched = false;

function initGlitchCanvas() {
  glitchCanvas = document.getElementById('glitch-canvas');
  glitchCtx = glitchCanvas.getContext('2d');

  function resizeGlitch() {
    glitchCanvas.width = window.innerWidth;
    glitchCanvas.height = window.innerHeight;
  }
  resizeGlitch();
  window.addEventListener('resize', resizeGlitch);
}

function renderCyberGlitch() {
  if (!glitchCtx || !glitchActive) return;
  const w = glitchCanvas.width;
  const h = glitchCanvas.height;

  glitchCtx.clearRect(0, 0, w, h);

  const numSlices = Math.floor(Math.random() * 8) + 4;
  for (let i = 0; i < numSlices; i++) {
    const sliceY = Math.random() * h;
    const sliceH = Math.random() * 35 + 5;
    const sliceOffsetX = (Math.random() - 0.5) * 80;

    glitchCtx.fillStyle = Math.random() > 0.5 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(236, 72, 153, 0.35)';
    glitchCtx.fillRect(sliceOffsetX, sliceY, w, sliceH);

    if (Math.random() > 0.6) {
      glitchCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      glitchCtx.fillRect(Math.random() * w, sliceY, Math.random() * 150 + 20, Math.random() * 4 + 1);
    }
  }

  const numBlocks = Math.floor(Math.random() * 12);
  for (let i = 0; i < numBlocks; i++) {
    const bx = Math.random() * w;
    const by = Math.random() * h;
    const bw = Math.random() * 120 + 20;
    const bh = Math.random() * 25 + 5;
    glitchCtx.fillStyle = 'rgba(14, 165, 233, 0.55)';
    glitchCtx.fillRect(bx, by, bw, bh);
  }
}

function trigger500msGlitch() {
  if (hasGlitched) return;
  hasGlitched = true;
  glitchActive = true;
  glitchStartTime = performance.now();
  glitchCanvas.style.opacity = '1';

  const glitchInterval = setInterval(() => {
    const elapsed = performance.now() - glitchStartTime;
    if (elapsed < 500) {
      renderCyberGlitch();
    } else {
      clearInterval(glitchInterval);
      glitchActive = false;
      glitchCanvas.style.opacity = '0';
      if (glitchCtx) glitchCtx.clearRect(0, 0, glitchCanvas.width, glitchCanvas.height);
      forceShowVisorCard();
    }
  }, 40);
}

function forceShowVisorCard() {
  const visorCard = document.getElementById('visor-card');
  visorCard.classList.remove('opacity-0');
  visorCard.classList.add('opacity-100');
}

function hideVisorCard() {
  const visorCard = document.getElementById('visor-card');
  visorCard.classList.remove('opacity-100');
  visorCard.classList.add('opacity-0');
}

// --- 4. 3D Three.js Robot Mascot ---
let scene, camera, renderer, clock;
let robotRoot, headGroup, eyeContainer, leftPupil, rightPupil;
let earLeftGroup, earRightGroup, neckCoreGroup, chestBadge;
let ambientLight, mainLight, mascotBacklight, bottomGlow;
let isIntroActive = true;
let introTime = 0;
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

let blinkTimer = 0;
let isBlinking = false;
let blinkProgress = 0;
let blinkCount = 0;
let targetBlinksForWiggle = getRandomBlinkThreshold();
let earWiggleTimer = 0;

function getRandomBlinkThreshold() {
  const choices = [3, 5, 7];
  return choices[Math.floor(Math.random() * choices.length)];
}

function init3D() {
  const container = document.getElementById('canvas-container');
  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 7.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
  mainLight.position.set(5, 8, 6);
  scene.add(mainLight);

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 4.0);
  rimLight.position.set(-6, 4, -4);
  scene.add(rimLight);

  mascotBacklight = new THREE.PointLight(0x38bdf8, 4.5, 12);
  mascotBacklight.position.set(0, 0, -2);
  scene.add(mascotBacklight);

  bottomGlow = new THREE.PointLight(0x38bdf8, 2.8, 10);
  bottomGlow.position.set(0, -3.5, 2.5);
  scene.add(bottomGlow);

  buildBoxyCuteRobot();
  setupEventListeners();
  initMascotLightScrollFade();
  animate3D();
}

function initMascotLightScrollFade() {
  const aboutSection = document.getElementById('about-us');
  if (!aboutSection) return;

  function updateMascotLights() {
    const scrollY = window.scrollY;
    const aboutTop = aboutSection.offsetTop - window.innerHeight * 0.5;

    if (mascotBacklight && bottomGlow) {
      if (scrollY >= aboutTop) {
        mascotBacklight.intensity = THREE.MathUtils.lerp(mascotBacklight.intensity, 0.0, 0.1);
        bottomGlow.intensity = THREE.MathUtils.lerp(bottomGlow.intensity, 0.0, 0.1);
      } else {
        const targetBacklight = isDarkMode ? 4.5 : 2.0;
        const targetGlow = isDarkMode ? 2.8 : 1.2;
        mascotBacklight.intensity = THREE.MathUtils.lerp(mascotBacklight.intensity, targetBacklight, 0.1);
        bottomGlow.intensity = THREE.MathUtils.lerp(bottomGlow.intensity, targetGlow, 0.1);
      }
    }
  }

  window.addEventListener('scroll', updateMascotLights, { passive: true });
}

function createRoundedBox(w, h, d, radius = 0.15, material) {
  const group = new THREE.Group();

  const mainCore = new THREE.Mesh(
    new THREE.BoxGeometry(w - radius * 2, h - radius * 2, d - radius * 2),
    material
  );
  group.add(mainCore);

  const slabX = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 2, h - radius * 2, d - radius * 2),
    material
  );
  slabX.position.x = w / 2 - radius;
  group.add(slabX);

  const slabX2 = slabX.clone();
  slabX2.position.x = -(w / 2 - radius);
  group.add(slabX2);

  const slabY = new THREE.Mesh(
    new THREE.BoxGeometry(w - radius * 2, radius * 2, d - radius * 2),
    material
  );
  slabY.position.y = h / 2 - radius;
  group.add(slabY);

  const slabY2 = slabY.clone();
  slabY2.position.y = -(h / 2 - radius);
  group.add(slabY2);

  const slabZ = new THREE.Mesh(
    new THREE.BoxGeometry(w - radius * 2, h - radius * 2, radius * 2),
    material
  );
  slabZ.position.z = d / 2 - radius;
  group.add(slabZ);

  const slabZ2 = slabZ.clone();
  slabZ2.position.z = -(d / 2 - radius);
  group.add(slabZ2);

  const edgeGeoY = new THREE.CylinderGeometry(radius, radius, h - radius * 2, 16);
  const cornerGeo = new THREE.SphereGeometry(radius, 16, 16);

  const xP = w / 2 - radius;
  const yP = h / 2 - radius;
  const zP = d / 2 - radius;

  [[-xP, -zP], [xP, -zP], [-xP, zP], [xP, zP]].forEach(([x, z]) => {
    const edge = new THREE.Mesh(edgeGeoY, material);
    edge.position.set(x, 0, z);
    group.add(edge);
  });

  [
    [xP, yP, zP],
    [-xP, yP, zP],
    [xP, -yP, zP],
    [-xP, -yP, zP],
    [xP, yP, -zP],
    [-xP, yP, -zP],
    [xP, -yP, -zP],
    [-xP, -yP, -zP]
  ].forEach(([x, y, z]) => {
    const corner = new THREE.Mesh(cornerGeo, material);
    corner.position.set(x, y, z);
    group.add(corner);
  });

  return group;
}

function buildBoxyCuteRobot() {
  robotRoot = new THREE.Group();
  scene.add(robotRoot);

  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.2,
    metalness: 0.8
  });

  const visorGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x020617,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.2,
    transparent: true,
    opacity: 0.95
  });

  const eyeGlowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true
  });

  const pupilMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.25,
    metalness: 0.9
  });

  headGroup = new THREE.Group();

  const headBox = createRoundedBox(2.2, 1.8, 1.8, 0.25, shellMat);
  headGroup.add(headBox);

  const visorBox = createRoundedBox(2.1, 1.45, 0.2, 0.12, visorGlassMat);
  visorBox.position.set(0, -0.05, 0.88);
  headGroup.add(visorBox);

  eyeContainer = new THREE.Group();
  eyeContainer.position.set(0, -0.05, 0.92);

  function createEyeNode(offsetX) {
    const eyeGroup = new THREE.Group();

    const eyeMesh = createRoundedBox(0.42, 0.48, 0.05, 0.1, eyeGlowMat);
    eyeGroup.add(eyeMesh);

    const pupil = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.22, 0.06),
      pupilMat
    );
    pupil.position.set(0, 0.02, 0.02);
    eyeGroup.add(pupil);

    const shine = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.07),
      pupilMat
    );
    shine.position.set(0.08, 0.1, 0.03);
    eyeGroup.add(shine);

    eyeGroup.position.x = offsetX;

    return { group: eyeGroup, pupil: pupil };
  }

  const lEyeData = createEyeNode(-0.46);
  const rEyeData = createEyeNode(0.46);

  leftPupil = lEyeData.pupil;
  rightPupil = rEyeData.pupil;

  eyeContainer.add(lEyeData.group);
  eyeContainer.add(rEyeData.group);
  headGroup.add(eyeContainer);

  earLeftGroup = new THREE.Group();
  earRightGroup = new THREE.Group();

  const earCapL = createRoundedBox(0.3, 0.6, 0.6, 0.08, shellMat);
  earLeftGroup.add(earCapL);

  const earPegL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16),
    accentMat
  );
  earPegL.rotation.z = Math.PI / 2;
  earPegL.position.x = -0.3;
  earLeftGroup.add(earPegL);

  const earLightL = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    eyeGlowMat
  );
  earLightL.position.x = -0.55;
  earLeftGroup.add(earLightL);

  earLeftGroup.position.set(-1.22, 0, 0);

  const earCapR = createRoundedBox(0.3, 0.6, 0.6, 0.08, shellMat);
  earRightGroup.add(earCapR);

  const earPegR = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16),
    accentMat
  );
  earPegR.rotation.z = -Math.PI / 2;
  earPegR.position.x = 0.3;
  earRightGroup.add(earPegR);

  const earLightR = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    eyeGlowMat
  );
  earLightR.position.x = 0.55;
  earRightGroup.add(earLightR);

  earRightGroup.position.set(1.22, 0, 0);

  headGroup.add(earLeftGroup);
  headGroup.add(earRightGroup);
  robotRoot.add(headGroup);

  neckCoreGroup = new THREE.Group();

  const neckPivot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.3, 24),
    shellMat
  );
  neckPivot.position.y = -1.05;
  neckCoreGroup.add(neckPivot);

  const chestBody = createRoundedBox(1.2, 0.8, 1.0, 0.15, shellMat);
  chestBody.position.y = -1.55;
  neckCoreGroup.add(chestBody);

  const badgeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  chestBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.42),
    badgeMaterial
  );

  chestBadge.position.set(0, -1.55, 0.506);
  neckCoreGroup.add(chestBadge);

  const badgeTextureLoader = new THREE.TextureLoader();
  badgeTextureLoader.load(
    'https://i.postimg.cc/4NGXPpGw/club-logo-cropped.png',
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      chestBadge.material.map = texture;
      chestBadge.material.needsUpdate = true;
    },
    undefined,
    (error) => {
      console.error('Could not load the club logo PNG:', error);
    }
  );

  robotRoot.add(neckCoreGroup);
  robotRoot.position.set(0, -10, 0);
}

function triggerMomentaryEarWiggle() {
  earWiggleTimer = 1.0;
}

function animate3D() {
  requestAnimationFrame(animate3D);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  mouse.x += (mouse.targetX - mouse.x) * 0.08;
  mouse.y += (mouse.targetY - mouse.y) * 0.08;

  blinkTimer += delta;

  if (blinkTimer > 3.2 && !isBlinking) {
    isBlinking = true;
    blinkProgress = 0;
  }

  if (isBlinking) {
    blinkProgress += delta * 4.5;
    let scaleY = 1.0;

    if (blinkProgress < 0.4) {
      scaleY = Math.max(0.02, 1.0 - blinkProgress / 0.4);
    } else if (blinkProgress < 0.65) {
      const openFactor = (blinkProgress - 0.4) / 0.25;
      scaleY = Math.min(1.0, Math.pow(openFactor, 0.5));
    } else {
      scaleY = 1.0;
      isBlinking = false;
      blinkTimer = 0;
      blinkCount++;

      if (blinkCount >= targetBlinksForWiggle) {
        triggerMomentaryEarWiggle();
        blinkCount = 0;
        targetBlinksForWiggle = getRandomBlinkThreshold();
      }
    }
    eyeContainer.scale.y = scaleY;
  } else {
    eyeContainer.scale.y = 1.0;
  }

  if (isIntroActive) {
    introTime += delta;
    const flightDuration = 2.2;

    if (introTime < flightDuration) {
      const progress = introTime / flightDuration;
      const easeOut = Math.sin(progress * Math.PI * 0.5);
      robotRoot.position.y = THREE.MathUtils.lerp(-10, 0.15, easeOut);
      robotRoot.rotation.y = (1 - easeOut) * Math.PI * 4;
    } else {
      skipIntro();
    }
  } else {
    const scrollY = window.scrollY;
    const totalHeight = window.innerHeight;
    const zoomProgress = Math.min(1.0, Math.max(0.0, scrollY / totalHeight));

    const targetCamZ = THREE.MathUtils.lerp(7.5, 1.55, zoomProgress);
    const targetCamY = THREE.MathUtils.lerp(0.0, -0.05, zoomProgress);

    camera.position.z += (targetCamZ - camera.position.z) * 0.1;
    camera.position.y += (targetCamY - camera.position.y) * 0.1;

    const eyeOpacity = Math.max(0, 1.0 - zoomProgress * 2.2);
    eyeContainer.visible = eyeOpacity > 0.02;

    eyeContainer.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = eyeOpacity;
      }
    });

    if (zoomProgress >= 0.75) {
      if (!hasGlitched) {
        trigger500msGlitch();
      } else {
        forceShowVisorCard();
      }
    } else if (zoomProgress < 0.4) {
      hasGlitched = false;
      hideVisorCard();
    }

    const trackFactor = 1.0 - zoomProgress * 0.95;
    robotRoot.position.y = 0.15 + Math.sin(time * 2.2) * 0.1 * trackFactor;
    headGroup.rotation.y = mouse.x * 0.4 * trackFactor;
    headGroup.rotation.x = -mouse.y * 0.25 * trackFactor;

    if (leftPupil && rightPupil) {
      leftPupil.position.x = mouse.x * 0.08 * trackFactor;
      leftPupil.position.y = mouse.y * 0.05 * trackFactor;
      rightPupil.position.x = mouse.x * 0.08 * trackFactor;
      rightPupil.position.y = mouse.y * 0.05 * trackFactor;
    }

    if (earWiggleTimer > 0) {
      earWiggleTimer -= delta;
      const wiggleWave = Math.sin((1.0 - earWiggleTimer) * Math.PI * 18) * earWiggleTimer;
      earLeftGroup.rotation.z = wiggleWave * 0.35;
      earRightGroup.rotation.z = -wiggleWave * 0.35;
    } else {
      earLeftGroup.rotation.z = Math.sin(time * 2) * 0.05;
      earRightGroup.rotation.z = -Math.sin(time * 2) * 0.05;
    }

    if (chestBadge) {
      chestBadge.rotation.z = Math.sin(time * 2) * 0.025;
    }
  }

  renderer.render(scene, camera);
}

function skipIntro() {
  isIntroActive = false;
  robotRoot.position.set(0, 0.15, 0);
  robotRoot.rotation.y = 0;
  triggerMomentaryEarWiggle();
  document.getElementById('skip-intro-btn').style.display = 'none';
  forceShowVisorCard();
}

function setupEventListeners() {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  document.getElementById('skip-intro-btn').addEventListener('click', () => {
    document.getElementById('iot-reveal').scrollIntoView({ behavior: 'smooth' });
    skipIntro();
  });
}

// --- 5. Events Module ---
function initEventsModule() {
  const events = [
    {
      id: "tech-tales",
      title: "Tech Tales: Stages and Timelines",
      category: "Multi-Stage Hackathon",
      status: "Completed 2024",
      date: "2024",
      venue: "IIIT Sri City",
      tagline: "A two-stage IoT hackathon taking teams from a problem proposal and ₹2,500 component budget to a 36-hour hardware prototyping sprint.",
      image: "images/TechTales_simple_banner.webp",
      imageAlt: "Tech Tales: Stages and Timelines event graphic",
      imageFit: "contain",
      hardware: ["Arduino", "NodeMCU", "Raspberry Pi 3B", "Sensors"],
      about: "Tech Tales: Stages and Timelines was a two-stage IoT hackathon focused on practical solutions in agriculture, healthcare, and water management. In Stage 1, teams submitted a PDF or PPTX presentation outlining their problem statement, proposed solution, and a priced component list within a ₹2,500 budget. Arduino, NodeMCU, and Raspberry Pi boards were available to support proposal planning. In Stage 2, teams took part in a 36-hour prototyping sprint, receiving their requested components along with an Arduino, two NodeMCUs, and a Raspberry Pi 3 Model B v1.2 (2GB). They used the allotted time to assemble, test, and complete a working prototype based on their proposal.",
      focus: "IoT ideation, system design, embedded programming, sensor integration, rapid prototyping.",
      eligibility: "Student teams interested in IoT, embedded systems, and practical hardware development.",
      timeline: [
        ["12 Feb 2025", "Stage 1 opens", "Submit a PDF/PPTX proposal describing the problem, solution, components, and build plan."],
        ["Proposal review", "Budget planning", "Selected teams plan a custom parts list with a ₹2,500 budget allocation."],
        ["3 Mar 2025", "Stage 2 sprint", "Build and demonstrate a working prototype during the 36-hour hardware prototyping sprint."]
      ],
      pipeline: [
        { title: "Stage 1 · Proposal", kicker: "Plan the build", text: "Submit a PDF or PPTX outlining the problem statement, proposed solution, block diagram, components, and execution timeline. Selected teams receive a custom parts budget allocation of ₹2,500.", items: ["PDF / PPTX proposal", "Problem + solution overview", "Custom parts budget: ₹2,500"] },
        { title: "Stage 2 · Prototype", kicker: "36-hour sprint", text: "Move from plan to a working hardware demonstration. Teams combine microcontrollers, sensors, and software, then present their prototype and design decisions.", items: ["36-hour build window", "Hardware kit allocation", "Prototype demonstration"] }
      ],
      kits: [
        ["1×", "Arduino", "Controller board"],
        ["2×", "NodeMCU", "Wi-Fi-enabled development boards"],
        ["1×", "Raspberry Pi 3 Model B", "Single-board computer"],
        ["Set", "Sensors", "Based on approved project requirements"]
      ]
    },
    {
      id: "gizmocon",
      title: "GizmoCon",
      category: "Hardware Race & Rapid Fabrication",
      status: "Completed 2024",
      date: "2024",
      venue: "IIIT Sri City",
      tagline: "A gadget-building race where technical skill, creativity, and hands-on engineering meet.",
      image: "images/GizmoCon.webp",
      imageAlt: "ConnexIon team at the GizmoCon event banner",
      imageFit: "cover",
      galleryImage: "images/GizmoCon.webp",
      galleryImageAlt: "GizmoCon event team standing beside the event banner",
      hardware: ["Embedded Boards", "Sensors", "Rapid Fabrication"],
      about: "GizmoCon is a gadget-building race that brings together participants with exceptional technical knowledge and hands-on skills to compete, innovate, and push beyond their own boundaries. The event challenges teams to turn ideas into working creations under time constraints, combining practical engineering, creative thinking, and rapid problem-solving. It provides an exciting platform for students to test their abilities, learn through experimentation, and showcase what they can build when technology meets imagination.",
      focus: "Rapid prototyping, embedded hardware integration, iterative design, and practical debugging.",
      eligibility: "For students keen to experiment with hardware and build a functional gadget.",
      timeline: [
        ["Briefing", "Challenge revealed", "Teams review the build objective, constraints, and available components."],
        ["Build window", "Prototype rapidly", "Design, assemble, test, and refine a working gadget."],
        ["Final review", "Demo & evaluation", "Show the result and explain the build choices."]
      ],
      kits: [
        ["As needed", "Embedded boards", "Controller platform"],
        ["As needed", "Sensors", "Inputs for the prototype"],
        ["Shared", "Fabrication tools", "Rapid build and iteration"]
      ]
    },
    {
      id: "fasttracking",
      title: "FastTracking",
      category: "RC Racing & Robotics",
      status: "Completed 2024",
      date: "2024",
      venue: "IIIT Sri City",
      tagline: "Top Gear for student-built RC cars: the fastest lap wins.",
      image: "images/FastTracking.webp",
      imageAlt: "Participants testing RC cars on the FastTracking course",
      imageFit: "cover",
      galleryImage: "images/FastTracking.webp",
      galleryImageAlt: "Participants testing and racing student-built RC cars during FastTracking",
      hardware: ["RC Cars", "Custom Chassis", "Radio Control"],
      about: "FastTracking is an RC racing event where contestants are handed a remote-controlled car built by ConnexIon students and take to the track to compete for the fastest lap time. Inspired by the high-energy spirit of Top Gear, the event brings together speed, control, and practical engineering in a lively competition. Participants navigate the course, refine their driving technique, and push for their best lap while experiencing the excitement of student-built robotics.",
      focus: "RC systems, chassis design, radio control, handling, testing, and performance tuning.",
      eligibility: "Students interested in RC vehicles, robotics, and hands-on mechanical-electronic systems.",
      timeline: [
        ["Setup", "Vehicle inspection", "Prepare the RC car and check basic control and safety."],
        ["Practice", "Tune the run", "Test handling and adjust the setup for a clean lap."],
        ["Race day", "Timed laps", "Compete for the fastest valid lap."]
      ],
      kits: [
        ["1×", "RC car", "Vehicle platform"],
        ["Custom", "Chassis", "Student-selected or modified frame"],
        ["1×", "Radio control", "Transmitter and receiver"]
      ]
    },
    {
      id: "electrothon",
      title: "Electrothon & Go Green with IoT",
      category: "Embedded Systems Lab",
      status: "Completed 2024",
      date: "2024",
      venue: "IIIT Sri City",
      tagline: "Innovative embedded systems projects and timed microcontroller challenges.",
      image: "images/Electrothon.webp",
      galleryImage: "images/Electrothon.webp",
      galleryImageAlt: "Participants working in a lecture hall during the event",
      hardware: ["Microcontrollers", "Sensors"],
      about: "Electrothon encourages participants to design and develop innovative projects using embedded systems and the Internet of Things (IoT). It gives students an opportunity to apply their technical knowledge to practical ideas, explore how hardware and software work together, and create solutions to real-world problems. Go Green with IoT adds a time-bound challenge in which participants use a microcontroller and sensors to solve a given problem.",
      focus: "Embedded systems, Internet of Things, microcontrollers, sensors, and sustainability-oriented problem solving.",
      eligibility: "Students interested in embedded systems and sustainability-themed technology.",
      timeline: [
        ["Project brief", "Choose a direction", "Understand the embedded project goal and identify required inputs and outputs."],
        ["Build session", "Prototype", "Connect microcontroller and sensors, then test core behaviour."],
        ["Challenge round", "Solve & explain", "Work through microcontroller puzzles and present the project."]
      ],
      kits: [
        ["1×", "Microcontroller", "Development board"],
        ["As needed", "Sensors", "Project-specific input devices"]
      ]
    },
    {
      id: "routex-2025",
      title: "ROUTEX – 2025",
      category: "Technical Learning Series",
      status: "Completed 2025",
      date: "2025",
      venue: "IIIT Sri City",
      tagline: "A multi-day learning series with NexSync, connecting students to practical roadmaps in Data Science and Web Development, plus insights from seniors and alumni.",
      image: "images/Routex1.webp",
      imageAlt: "ROUTEX 2025 students attending a technical session",
      hardware: ["Data Science", "Web Development", "Career Guidance"],
      galleryImages: [
        ["images/Routex1.webp", "ROUTEX 2025 technical session with students learning about career pathways"],
        ["images/Routex2.webp", "ROUTEX 2025 participants and organizers at IIIT Sri City"]
      ],
      about: "ROUTEX 2025 was a multi-day technical learning series organized by ConnexIon in collaboration with NexSync. During the academic year, the series featured sessions on Data Science and Web Development, helping students understand the skills, learning paths, and practical foundations needed to explore these fields.",
      focus: "Data Science, Web Development, technical learning roadmaps, industry experience, and career exploration.",
      eligibility: "Designed for students interested in exploring technology domains and understanding future skillsets.",
      timeline: [
        ["Explore", "Understand the domain", "Get an introduction to Data Science and Web Development."],
        ["Plan", "Build a roadmap", "Learn foundational skills and practical next steps."],
        ["Connect", "Hear real experiences", "Gain insights from senior students and alumni."]
      ],
      kits: [
        ["01", "Data Science", "Foundations and learning roadmap"],
        ["02", "Web Development", "Core skills and development roadmap"],
        ["03", "Career Insights", "Guidance from seniors and alumni"]
      ]
    },
    {
      id: "rover-challenge",
      title: "Rover Challenge",
      category: "Robotics & Autonomous Systems",
      status: "Completed",
      date: "2025",
      venue: "IIIT Sri City",
      tagline: "A hands-on internal challenge where teams built autonomous rovers and tested their navigation and obstacle-avoidance skills.",
      image: "images/Rover1.webp",
      imageAlt: "Student-built rover with sensors and electronics",
      galleryImages: [
        ["images/Rover1.webp", "Student-built rover featuring sensors, wiring, and a front-mounted ultrasonic sensor"],
        ["images/Rover2.webp", "Rover prototype tested alongside its autonomous rover dashboard"]
      ],
      hardware: ["Autonomous Rovers", "Obstacle Detection", "Sensors & Electronics", "Embedded Programming"],
      about: "The Rover Challenge was an internal ConnexIon activity designed to strengthen members’ practical skills in robotics and autonomous systems. Participants were divided into three teams, with each team responsible for designing and developing its own rover. A dedicated test track featuring predefined paths and obstacles was created to evaluate each build.",
      focus: "Robotics, autonomous navigation, sensor integration, and embedded programming.",
      eligibility: "Internal ConnexIon members interested in robotics and embedded systems.",
      timeline: [
        ["Design", "Build the rover", "Teams designed and assembled a rover by integrating mechanical platform and control electronics."],
        ["Program", "Develop autonomous behaviour", "Participants programmed their systems to follow a route and detect obstacles."],
        ["Test", "Navigate the course", "Each rover was evaluated on its ability to move through the test track."]
      ],
      kits: [
        ["01", "Mechanical Design", "Chassis, wheels, and rover assembly"],
        ["02", "Electronics & Sensors", "Controller boards, wiring, and obstacle detection"],
        ["03", "Autonomous Navigation", "Programming, testing, and debugging rover behaviour"]
      ]
    },
    {
      id: "expo-2k26",
      title: "Research Expo 2K26",
      category: "Robotics Showcase",
      status: "Completed 2026",
      date: "2026",
      venue: "IIIT Sri City",
      tagline: "A showcase of ConnexIon’s flagship rover project, featuring live demonstrations of its design, navigation, and obstacle-detection capabilities.",
      hardware: ["Rover Robotics", "Autonomous Navigation", "Obstacle Detection"],
      image: "images/Expo1.webp",
      imageAlt: "ConnexIon members presenting their rover at Research Expo 2K26",
      about: "As part of Research Expo 2K26, ConnexIon showcased its flagship rover to students, faculty, and visitors. The team presented the rover’s design, features, and capabilities through live demonstrations and field tests.",
      galleryImages: [
        ["images/Expo1.webp", "ConnexIon team and rover at Research Expo 2K26"],
        ["images/Expo2.webp", "ConnexIon members explaining the rover project during Research Expo 2K26"]
      ],
      focus: "Rover engineering, robotics, autonomous navigation, obstacle detection, mechanical design, electronics integration, and software development.",
      eligibility: "Open showcase for all Research Expo visitors.",
      timeline: [
        ["Showcase", "Introduce the rover", "Present the rover’s design, key features, and development process to visitors."],
        ["Demonstrate", "Test its capabilities", "Use live demonstrations and field tests to highlight navigation and obstacle detection."],
        ["Discuss", "Share the engineering", "Explain how mechanical systems, electronics, and software work together."]
      ],
      kits: [
        ["01", "Mechanical Design", "Rover frame and mobility system"],
        ["02", "Electronics", "Control hardware and sensor integration"],
        ["03", "Software", "Navigation and obstacle-detection logic"]
      ]
    }
  ];

  const track = document.getElementById("carousel-track");
  const viewport = document.getElementById("carousel-viewport");
  const modal = document.getElementById("event-modal");
  const modalClose = document.getElementById("modal-close");

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));

  function cardMarkup(event) {
    return `
      <article class="event-card" data-event-id="${esc(event.id)}">
        <div class="event-image">
          <img src="${esc(event.image)}" alt="${esc(event.imageAlt || event.title)}" loading="lazy" draggable="false" style="${event.imageFit === "contain" ? "object-fit:contain;padding:10px" : "object-fit:cover"}">
          <div class="image-overlay"></div>
        </div>
        <div class="border-b border-slate-700/30 px-3 py-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="badge badge-status"><i class="fa-solid fa-check"></i>${esc(event.status)}</span>
            <span class="badge badge-category">${esc(event.category)}</span>
          </div>
        </div>
        <div class="flex flex-1 flex-col p-3">
          <h3 class="font-display text-lg font-bold leading-tight text-white">${esc(event.title)}</h3>
          <p class="mt-1.5 min-h-[58px] text-xs leading-[1.15rem] text-slate-400">${esc(event.tagline)}</p>
          <div class="mt-3 space-y-1.5 border-y border-slate-700/30 py-2">
            <p class="flex items-start gap-2 text-xs text-slate-400"><i class="fa-regular fa-calendar mt-0.5 w-4 text-sky-400"></i><span>${esc(event.date)}</span></p>
            <p class="flex items-start gap-2 text-xs text-slate-400"><i class="fa-solid fa-location-dot mt-0.5 w-4 text-sky-400"></i><span>${esc(event.venue)}</span></p>
          </div>
          <div class="mt-2 min-h-[28px] flex flex-wrap content-start gap-1">${event.hardware.map(tag => `<span class="hardware-chip">${esc(tag)}</span>`).join("")}</div>
          <div class="mt-auto pt-3"><button type="button" class="details-btn" data-open-event="${esc(event.id)}">View Details <i class="fa-solid fa-arrow-right"></i></button></div>
        </div>
      </article>`;
  }

  function renderCards() {
    track.innerHTML = events.map(cardMarkup).join("") + events.map(cardMarkup).join("");
  }
  renderCards();

  let offset = 0;
  let setWidth = 0;
  let baseSpeed = 0.2;
  let dragging = false;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let modalOpen = false;
  let activeEvent = null;

  function measure() {
    const firstSet = [...track.children].slice(0, events.length);
    if (!firstSet.length) return;
    const first = firstSet[0].getBoundingClientRect();
    const last = firstSet[firstSet.length - 1].getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    setWidth = last.right - first.left + gap;
    if (setWidth > 0) offset = ((offset % setWidth) + setWidth) % setWidth;
  }

  function normalizeOffset() {
    if (setWidth <= 0) return;
    while (offset >= setWidth) offset -= setWidth;
    while (offset < 0) offset += setWidth;
  }

  function animateCarousel() {
    if (!dragging && !modalOpen) {
      offset += baseSpeed;
      normalizeOffset();
      track.style.transform = `translate3d(${-offset}px,0,0)`;
    }
    requestAnimationFrame(animateCarousel);
  }
  requestAnimationFrame(animateCarousel);

  viewport.addEventListener("pointerdown", e => {
    if (e.target.closest("button")) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartOffset = offset;
  });
  viewport.addEventListener("pointermove", e => {
    if (!dragging) return;
    offset = dragStartOffset - (e.clientX - dragStartX);
    normalizeOffset();
    track.style.transform = `translate3d(${-offset}px,0,0)`;
  });
  const stopDrag = () => { dragging = false; };
  viewport.addEventListener("pointerup", stopDrag);
  viewport.addEventListener("pointercancel", stopDrag);

  const stageMarkup = event => `
    <div class="modal-section">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><p class="section-kicker mb-2">Stage pipeline</p><h3 class="font-display text-xl font-bold">From brief to build</h3></div>
        <span class="font-mono text-[10px] text-slate-400">02 PHASES / PROJECT FLOW</span>
      </div>
      <div class="mb-4 flex flex-wrap gap-2" role="tablist">
        ${event.pipeline.map((s, i) => `<button id="stage-tab-${i}" class="tab-button" role="tab" aria-selected="${i === 0}" data-stage-index="${i}">${esc(s.title)}</button>`).join("")}
      </div>
      <div id="stage-panel" class="rounded-xl border border-slate-700/40 bg-slate-900/40 p-5">
        <p id="stage-kicker" class="font-mono text-[10px] uppercase tracking-[.16em] text-sky-400"></p>
        <p id="stage-text" class="mt-3 text-sm leading-7 text-slate-300"></p>
        <ul id="stage-items" class="mt-4 grid gap-2 sm:grid-cols-3"></ul>
      </div>
    </div>`;

  function commonContent(event) {
    const photos = event.galleryImages || (event.galleryImage ? [[event.galleryImage, event.galleryImageAlt || "Event photo"]] : []);
    const eventPhoto = photos.length ? `
      <div class="modal-section">
        <div class="mb-4"><p class="section-kicker mb-2">Event gallery</p><h3 class="font-display text-xl font-bold">Moments from the event</h3></div>
        <div class="grid grid-cols-1 gap-4 ${photos.length > 1 ? "sm:grid-cols-2" : ""}">
          ${photos.map(([src, alt]) => `<figure><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" class="w-full rounded-xl border border-slate-700/40 object-cover" style="max-height:380px;"><figcaption class="mt-2 text-xs text-slate-400">${esc(alt)}</figcaption></figure>`).join("")}
        </div>
      </div>` : "";

    const focusSec = event.focus ? `
      <div class="modal-section">
        <p class="section-kicker mb-2">Core Focus</p>
        <p class="text-sm leading-relaxed text-slate-300">${esc(event.focus)}</p>
      </div>` : "";

    const eligSec = event.eligibility ? `
      <div class="modal-section">
        <p class="section-kicker mb-2">Eligibility</p>
        <p class="text-sm leading-relaxed text-slate-300">${esc(event.eligibility)}</p>
      </div>` : "";

    const pipelineSec = event.pipeline ? stageMarkup(event) : "";

    const timelineSec = event.timeline ? `
      <div class="modal-section">
        <p class="section-kicker mb-4">Event Timeline</p>
        <div class="space-y-4">
          ${event.timeline.map(([time, title, desc]) => `
            <div class="timeline-item">
              <span class="font-mono text-xs text-sky-400 font-bold">${esc(time)}</span>
              <h4 class="font-bold text-sm text-white mt-0.5">${esc(title)}</h4>
              <p class="text-xs text-slate-300 mt-1 leading-relaxed">${esc(desc)}</p>
            </div>`).join("")}
        </div>
      </div>` : "";

    const kitsSec = event.kits ? `
      <div class="modal-section">
        <p class="section-kicker mb-4">Hardware & Allocation</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${event.kits.map(([qty, name, role]) => `
            <div class="kit-card">
              <div class="flex items-center justify-between">
                <span class="font-bold text-sm text-white">${esc(name)}</span>
                <span class="font-mono text-xs text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20">${esc(qty)}</span>
              </div>
              <p class="text-xs text-slate-400 mt-1">${esc(role)}</p>
            </div>`).join("")}
        </div>
      </div>` : "";

    return `
      <div class="modal-section">
        <p class="section-kicker mb-3">About the event</p>
        <h3 class="font-display text-2xl font-bold mb-3">${esc(event.title)}</h3>
        <p class="text-sm leading-7 text-slate-300">${esc(event.about || event.tagline || "")}</p>
      </div>
      ${focusSec}
      ${eligSec}
      ${pipelineSec}
      ${timelineSec}
      ${kitsSec}
      ${eventPhoto}
      <div class="flex justify-end border-t border-slate-700/40 p-5">
        <button type="button" onclick="closeModal()" class="control-btn px-6 font-bold"><span>Close details</span><i class="fa-solid fa-xmark"></i></button>
      </div>`;
  }

  function activateStage(index) {
    if (!activeEvent || !activeEvent.pipeline) return;
    const stage = activeEvent.pipeline[index];
    document.querySelectorAll("[data-stage-index]").forEach((btn, i) => {
      btn.setAttribute("aria-selected", String(i === index));
    });
    document.getElementById("stage-kicker").textContent = stage.kicker;
    document.getElementById("stage-text").textContent = stage.text;
    document.getElementById("stage-items").innerHTML = stage.items.map(item => `<li class="flex items-start gap-2 text-xs leading-5 text-slate-300"><i class="fa-solid fa-check mt-1 text-emerald-400"></i><span>${esc(item)}</span></li>`).join("");
  }

  function openModal(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;
    activeEvent = event;
    modalOpen = true;
    document.getElementById("modal-title").textContent = event.title;
    document.getElementById("modal-date").innerHTML = `<i class="fa-regular fa-calendar mr-2 text-sky-400"></i>${esc(event.date)} <span class="mx-2">/</span> <i class="fa-solid fa-location-dot mr-1 text-sky-400"></i>${esc(event.venue)}`;
    document.getElementById("modal-badges").innerHTML = `<span class="badge badge-status"><i class="fa-solid fa-check"></i>${esc(event.status)}</span><span class="badge badge-category">${esc(event.category)}</span>`;
    
    const content = document.getElementById("modal-content");
    content.innerHTML = commonContent(event);
    
    if (event.pipeline) {
      activateStage(0);
      content.addEventListener("click", e => {
        const btn = e.target.closest("[data-stage-index]");
        if (btn) activateStage(Number(btn.dataset.stageIndex));
      });
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  window.closeModal = function() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    modalOpen = false;
    activeEvent = null;
  };

  track.addEventListener("click", e => {
    const btn = e.target.closest("[data-open-event]");
    if (btn) openModal(btn.dataset.openEvent);
  });
  modalClose.addEventListener("click", window.closeModal);
  modal.addEventListener("click", e => {
    if (e.target === modal) window.closeModal();
  });

  window.addEventListener("resize", measure);
  measure();
}

// --- 6. Integrated 3D Projects Ring Engine ---
function initProjectsModule() {
  const PROJECTS = [
    {
      img: "images/Autonomous_rover.webp",
      t: "Autonomous Vision Rover",
      s: "Completed",
      o: "A four-wheeled rover that navigates on its own, detects obstacles and streams telemetry to a web dashboard.",
      d: "Autonomous robotics · edge computer vision",
      f: ["OpenCV visual obstacle detection, backed by ultrasonic distance checks.", "Fail-safe emergency stop when a safety boundary is breached.", "Live web dashboard with video, range data, status indicators (Active Trajectory, Maneuvering, Safe-Stop) and manual override."],
      h: ["Raspberry Pi 3/4", "Pi Camera", "L298N / TB6612FNG", "HC-SR04", "300 RPM gear motors", "Protected battery"]
    },
    {
      img: "images/ANPR_System.webp",
      t: "ANPR System",
      s: "Completed",
      o: "Automatic Number Plate Recognition: real-time plate detection, character reading and vehicle logging.",
      d: "AI/ML deep learning · computer vision",
      f: ["Custom-trained YOLOv8 model (Roboflow datasets) locates the plate.", "Cropping, bilateral filtering, Otsu thresholding and perspective correction feed Tesseract OCR.", "Results are timestamped and saved to car_plate_data_stored.csv."],
      h: ["Python", "OpenCV", "PyTesseract", "Pandas", "Ultralytics YOLOv8", "USB / RPi camera", "Edge PC"]
    },
    {
      img: "images/agricultural_rover.webp",
      t: "Precision Agriculture Rover",
      s: "Completed",
      o: "A rover for GPS-denied fields that diagnoses plant disease, maps crop health and sprays only where needed.",
      d: "Agri-tech · field robotics · edge AI",
      f: ["Quantised YOLOv8 Nano on a Raspberry Pi 5 at about 30 FPS for foliar disease detection.", "HSV-based visual row tracking keeps it centred between crop lines.", "Dead-reckoning grid mapping from odometry.", "OpenWeatherMap integration for climate-risk alerts.", "Demonstrated at Research Expo 2026 during Abhisarga."],
      h: ["Raspberry Pi 5", "Arduino UNO", "Pi Camera Module 2", "BTS motor driver", "Soil moisture sensors", "DHT22", "Solenoid spray valves", "LiPo battery"]
    },
    {
      img: "images/Smart_streetlight.webp",
      pos: "center 85%",
      t: "Smart Streetlight Control",
      s: "Completed",
      o: "Streetlights that match real-time demand, cutting grid use while avoiding dark spots.",
      d: "Smart municipal infrastructure · IoT power optimisation",
      f: ["BH1750 lux sensing keeps lights off in daylight, whatever the motion.", "Ultrasonic/IR sensors switch lights on in under a second when a vehicle or pedestrian approaches.", "Relay modules control each fixture individually, with no human intervention."],
      h: ["BH1750", "Ultrasonic / IR sensors", "Relay modules", "ESP8266 / Arduino", "LED arrays", "Buck converter"]
    },
    {
      img: "images/Smart_Classroom.webp",
      t: "Smart Classroom Energy Management",
      s: "Proposed",
      o: "An IoT system for large classrooms split into 6 zones, giving the administration real-time data to cut energy wastage.",
      d: "IoT building energy management",
      f: ["Occupancy and ambient-condition detection drives automatic zone-wise control of lights and fans.", "Classroom-level control of the AC (via IR) and the projector.", "Energy monitoring with a real-time dashboard that highlights wastage and supports infrastructure decisions."],
      h: ["ESP32", "PIR / mmWave occupancy sensors", "LDRs", "Temperature sensors", "Current / voltage sensors", "Relays / contactors", "IR control"]
    }
  ];

  const N = PROJECTS.length;
  const STEP = 360 / N;
  const $ = s => document.querySelector(s);
  const app = $('#app'), scene = $('#scene'), ring = $('#ring'),
        detail = $('#detail'), dpanel = $('#dpanel'), dscroll = $('#dscroll'), sheetsEl = $('#sheets'), countEl = $('#count');

  if (!app || !ring) return;

  const DEG = Math.PI / 180;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const wrap = a => ((a % 360) + 540) % 360 - 180;
  const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  ring.innerHTML = '';
  sheetsEl.innerHTML = '';
  
 const cards = PROJECTS.map((p, i) => {
    const el = document.createElement('div');
    el.className = 'pc';
    el.dataset.i = i;
    
    // Add specific style adjustment for the streetlight image container/image
    const imgStyle = p.t === "Smart Streetlight Control" 
      ? "width:100%;height:130%;object-fit:cover;object-position:center top;margin-top:-15%;border-radius:18px;" 
      : "width:100%;height:100%;object-fit:cover;border-radius:18px;";

    el.innerHTML = '<div class="icon" aria-hidden="true"><img src="' + esc(p.img) + '" alt="' + esc(p.t) + '" style="' + imgStyle + '" /></div><h3>' + esc(p.t) + '</h3><p>' + esc(p.o) + '</p><span class="tag' + (p.s === 'Proposed' ? ' prop' : '') + '">' + p.s + '</span>';
    ring.appendChild(el);
    return { el };
  });

  const sheets = PROJECTS.map(p => {
    const el = document.createElement('section');
    el.className = 'dsheet';
    el.setAttribute('aria-label', p.t);
    const imgPos = p.t === "Smart Streetlight Control" ? "center 85%" : "center";
    el.innerHTML = '<div><div class="ic" aria-hidden="true"><img src="' + esc(p.img) + '" alt="' + esc(p.t) + '" style="width:100%;max-height:160px;object-fit:cover;object-position:' + imgPos + ';border-radius:12px;margin-bottom:0.7rem;" /></div><h3>' + esc(p.t) + '</h3><span class="st' + (p.s === 'Proposed' ? ' prop' : '') + '">' + p.s + '</span><p class="dom">' + esc(p.d) + '</p><p class="lead">' + esc(p.o) + '</p></div><div><h4>Key features</h4><ul>' + p.f.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div><div><h4>Hardware and stack</h4><div class="chips">' + p.h.map(x => '<span>' + esc(x) + '</span>').join('') + '</div></div>';
    sheetsEl.appendChild(el);
    return el;
  });

  let rot = 0, target = 0;
  let fp = 0, focusT = 0;
  let cw = 280, ch = 390, R = 380, P = 1500, W = 1200, H = 800, HH = 100;
  let narrow = false, activeIdx = -1, raf = 0, last = 0;
  let lambda = 7, wheelActive = false, lastWheel = 0, wheelAcc = 0, lastStep = 0;
  const LAM_DRAG = RM ? 90 : 26, LAM_WHEEL = RM ? 60 : 16, LAM_SNAP = RM ? 50 : 7, DUR = RM ? .01 : .7;
  let KD = (57.3 / R) * 1.25;

  function measure() {
    W = app.clientWidth; H = app.clientHeight;
    const big = app.querySelector('.big'); HH = big ? big.offsetHeight : 100;
    const availH = Math.max(120, H - HH - 16);
    cw = Math.max(220, Math.min(320, W * .68, availH / 1.32)); 
    ch = cw * 1.38;
    app.style.setProperty('--w', cw + 'px'); 
    app.style.setProperty('--h', ch + 'px');
    
    R = Math.round(cw * 1.35);
    P = 1500;
    KD = (57.3 / R) * 1.25;
    narrow = W < 760 || W / H < .85;
    app.classList.toggle('narrow', narrow);
    scene.style.perspective = P + 'px';
    cards.forEach((c, i) => { c.el.style.transform = `rotateY(${i * STEP}deg) translateZ(${R}px)`; });
  }

  function render() {
    const f = ease(fp);
    const sf = 1 - (narrow ? .5 : 0) * f, zf = (narrow ? 0 : R * .2) * f;
    const pf = P / (P - (-R + zf + R * sf)), oy = H / 2, ringY = HH + (H - HH) / 2;
    let X = 0, Y = 0;
    if (narrow) { const yc = ringY + ((HH + (H - HH) * .24) - ringY) * f; Y = (yc - oy) / pf - (ringY - oy); }
    else X = -(.5 - .27) * W * f / pf;
    
    ring.style.transform = `translate3d(${X.toFixed(2)}px,${Y.toFixed(2)}px,${(-R + zf).toFixed(2)}px) scale3d(${sf.toFixed(4)},${sf.toFixed(4)},${sf.toFixed(4)}) rotateY(${(-rot).toFixed(3)}deg)`;

    let near = 0, nd = 1e9;
    for (let i = 0; i < N; i++) {
      const d = wrap(i * STEP - rot), ad = Math.abs(d);
      const depth = .5 + .5 * Math.cos(d * DEG);
      const oFree = 0.38 + 0.62 * depth;
      
      const k = clamp(1 - ad / 40, 0, 1), kk = k * k * (3 - 2 * k);
      const c = cards[i].el;
      
      c.style.opacity = (oFree + (kk - oFree) * f).toFixed(3);
      c.style.pointerEvents = focusT ? (ad < 5 ? 'auto' : 'none') : (depth > .3 ? 'auto' : 'none');
      c.style.zIndex = Math.round(depth * 20) + 10;
      if (ad < nd) { nd = ad; near = i; }
    }
    if (near !== activeIdx) setActive(near);

    const g = clamp((f - .4) / .6, 0, 1), ge = g * g * (3 - 2 * g);
    dpanel.style.opacity = ge.toFixed(3);
    dpanel.style.transform = narrow
      ? `translate3d(0,${((1 - ge) * 28).toFixed(1)}px,0)`
      : `translate3d(${((1 - ge) * 40).toFixed(1)}px,0,0)`;
  }

  function setActive(i) {
    activeIdx = i;
    sheets.forEach((s, j) => s.classList.toggle('on', j === i));
    if (countEl) countEl.innerHTML = `${i + 1} of ${N} · ${PROJECTS[i].s}`;
    if (dscroll && dscroll.scrollTop) dscroll.scrollTop = 0;
  }

  function frame(t) {
    raf = 0;
    const dt = last ? Math.min(.05, (t - last) / 1000) : .016;
    last = t;
    if (wheelActive && t - lastWheel > 130) { wheelActive = false; snap(0); }
    rot += (target - rot) * (1 - Math.exp(-dt * lambda));
    if (fp !== focusT) fp = focusT ? Math.min(1, fp + dt / DUR) : Math.max(0, fp - dt / DUR);
    render();
    const moving = Math.abs(target - rot) > .02 || fp !== focusT || dragging || wheelActive;
    if (moving) raf = requestAnimationFrame(frame);
    else {
      rot = target; last = 0; render();
      if (!focusT && fp === 0) detail.inert = true;
    }
  }

  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function snap(extra) { target = Math.round((target + extra) / STEP) * STEP; lambda = LAM_SNAP; kick(); }
  function step(dir) { target = (Math.round(target / STEP) + dir) * STEP; lambda = LAM_SNAP; kick(); }
  function goTo(i) {
    const base = Math.round(target / STEP), cur = ((base % N) + N) % N;
    let diff = i - cur;
    if (diff > N / 2) diff -= N;
    if (diff < -N / 2) diff += N;
    target = (base + diff) * STEP; lambda = LAM_SNAP; kick();
  }
  function enter() {
    if (focusT) return;
    target = Math.round(target / STEP) * STEP; lambda = LAM_SNAP;
    focusT = 1; detail.inert = false; app.classList.add('is-focus'); kick();
  }
  function exit() {
    if (!focusT) return;
    focusT = 0; app.classList.remove('is-focus'); kick();
    try { app.focus({ preventScroll: true }); } catch (_) {}
  }
  function clickAt(el) {
    const card = el && el.closest ? el.closest('.pc') : null;
    if (!focusT) {
      if (!card) return;
      const i = +card.dataset.i;
      if (i === activeIdx) enter(); else { goTo(i); enter(); }
    } else if (!card) exit();
  }

  let pid = null, sx = 0, sy = 0, baseT = 0, moved = false, down = null, lastX = 0, lastT = 0, vel = 0, stepped = false, dragging = false;
  function onDown(e) {
    if (pid !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.detail, button')) return;
    pid = e.pointerId; sx = lastX = e.clientX; sy = e.clientY; lastT = e.timeStamp;
    baseT = target; moved = false; stepped = false; vel = 0; down = e.target;
    try { app.setPointerCapture(pid); } catch (_) {}
  }
  function onMove(e) {
    if (e.pointerId !== pid) return;
    const dx = e.clientX - sx;
    if (!moved) {
      if (Math.hypot(dx, e.clientY - sy) < 6) return;
      moved = true;
      if (!focusT) { dragging = true; wheelActive = false; baseT = target; app.classList.add('drag'); }
    }
    if (focusT) { if (!stepped && Math.abs(dx) > 56) { stepped = true; step(dx < 0 ? 1 : -1); } return; }
    const dt = Math.max(1, e.timeStamp - lastT);
    vel = vel * .75 + (-(e.clientX - lastX) * KD / dt) * .25;
    lastX = e.clientX; lastT = e.timeStamp;
    target = baseT - dx * KD; lambda = LAM_DRAG; kick();
  }
  function onUp(e) {
    if (e.pointerId !== pid) return;
    const idle = e.timeStamp - lastT > 80;
    pid = null;
    try { app.releasePointerCapture(e.pointerId); } catch (_) {}
    app.classList.remove('drag');
    if (dragging) { dragging = false; snap(idle ? 0 : vel * 160); return; }
    if (!moved) clickAt(down);
  }
  function onCancel(e) {
    if (e.pointerId !== pid) return;
    pid = null; app.classList.remove('drag');
    if (dragging) { dragging = false; snap(0); }
  }

  app.addEventListener('pointerdown', onDown, { passive: true });
  app.addEventListener('pointermove', onMove, { passive: true });
  app.addEventListener('pointerup', onUp, { passive: true });
  app.addEventListener('pointercancel', onCancel, { passive: true });

  function onWheel(e) {
    let dx = e.deltaX, dy = e.deltaY;
    if (e.deltaMode === 1) { dx *= 16; dy *= 16; } else if (e.deltaMode === 2) { dx *= W; dy *= W; }
    if (e.shiftKey && !dx) { dx = dy; dy = 0; }
    const now = performance.now();
    if (Math.abs(dx) <= Math.abs(dy)) {
      if (e.target.closest && e.target.closest('.dpanel')) return;
      const notch = e.deltaMode !== 0 || (dy !== 0 && Math.abs(dy) >= 100 && dy % 100 === 0);
      if (notch && now - lastStep > 160) { lastStep = now; step(dy > 0 ? 1 : -1); }
      return;
    }
    dx = clamp(dx, -140, 140);
    if (focusT) {
      if (now - lastWheel > 220) wheelAcc = 0;
      lastWheel = now; wheelAcc += dx;
      if (Math.abs(wheelAcc) > 90 && now - lastStep > 380) { lastStep = now; step(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; }
      return;
    }
    target += dx * KD * .9; lambda = LAM_WHEEL; wheelActive = true; lastWheel = now; kick();
  }
  app.addEventListener('wheel', onWheel, { passive: true });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { exit(); return; }
    const onButton = document.activeElement && document.activeElement.tagName === 'BUTTON';
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if ((e.key === 'Enter' || e.key === ' ') && !onButton && document.activeElement === app) { e.preventDefault(); enter(); }
  });

  const closeBtn = $('#close');
  if (closeBtn) closeBtn.addEventListener('click', exit);

  const prevBtn = $('#prev');
  if (prevBtn) prevBtn.addEventListener('click', () => step(-1));

  const nextBtn = $('#next');
  if (nextBtn) nextBtn.addEventListener('click', () => step(1));

  measure();
  new ResizeObserver(() => { measure(); render(); }).observe(app);
  rot = RM ? target : target - 36;
  render();
  kick();
}

// --- 7. Exact Team Showcase & Directory Interactive Logic ---
function initTeamShowcaseModule() {
  // Card Flip Handler
  document.querySelectorAll('.member-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('is-flipped');
    });
  });

  // Wings Toggle & Scroll Handler
  const wingsBtn = document.getElementById('toggle-wings-btn');
  const wingsPanel = document.getElementById('specialized-wings');
  if (wingsBtn && wingsPanel) {
    wingsBtn.addEventListener('click', () => {
      wingsPanel.hidden = !wingsPanel.hidden;
    });
  }

  // Scroll to respective wing when a wing button is clicked
  document.querySelectorAll('.wing-opt').forEach(button => {
    button.addEventListener('click', () => {
      const targetWingId = button.getAttribute('data-wing');
      const directory = document.getElementById('directory');
      const toggleMembersBtn = document.getElementById('toggle-members-btn');

      // Ensure directory is visible before scrolling
      if (directory && directory.style.display === 'none') {
        directory.style.display = 'block';
        if (toggleMembersBtn) toggleMembersBtn.textContent = 'Hide Members ↑';
      }

      if (targetWingId) {
        const targetElement = document.getElementById(targetWingId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Hide / Explore Members Toggle Logic
  const directory = document.getElementById('directory');
  const toggleMembersBtn = document.getElementById('toggle-members-btn');
  const exploreMembersBtn = document.getElementById('explore-members-btn');

  function toggleDirectory() {
    if (directory) {
      const isHidden = directory.style.display === 'none';
      directory.style.display = isHidden ? 'block' : 'none';
      if (toggleMembersBtn) {
        toggleMembersBtn.textContent = isHidden ? 'Hide Members ↑' : 'Show Members ↓';
      }
    }
  }

  toggleMembersBtn?.addEventListener('click', toggleDirectory);

  exploreMembersBtn?.addEventListener('click', () => {
    if (directory && directory.style.display === 'none') {
      directory.style.display = 'block';
      if (toggleMembersBtn) toggleMembersBtn.textContent = 'Hide Members ↑';
    }
    directory?.scrollIntoView({ behavior: 'smooth' });
  });

  // Modal Logic
  const alumniModal = document.getElementById('alumni-dialog');
  const communityModal = document.getElementById('community-dialog');

  document.getElementById('open-alumni-btn')?.addEventListener('click', () => alumniModal?.showModal());
  document.getElementById('open-alumni-stat-btn')?.addEventListener('click', () => alumniModal?.showModal());
  document.getElementById('open-community-btn')?.addEventListener('click', () => communityModal?.showModal());

  document.querySelectorAll('.close-dialog').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('dialog')?.close();
    });
  });

  // Filter & Search Logic
  const searchInput = document.getElementById('member-search');
  const roleBtns = document.querySelectorAll('.filter-button');

  function filterMembers() {
    const query = searchInput?.value.toLowerCase() || "";
    const activeRole = document.querySelector('.filter-button[aria-pressed="true"]')?.dataset.role || 'all';

    document.querySelectorAll('.members-grid .member-card').forEach(card => {
      const text = card.innerText.toLowerCase();
      const role = card.dataset.role;
      const matchesSearch = text.includes(query);
      const matchesRole = activeRole === 'all' || role === activeRole;

      card.style.display = matchesSearch && matchesRole ? 'block' : 'none';
    });
  }

  searchInput?.addEventListener('input', filterMembers);
  roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roleBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      filterMembers();
    });
  });
}

// --- Navigation Drawer Overlay Controls ---
function initNavigationDrawer() {
  const drawer = document.getElementById('nav-drawer');
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const closeBtn = document.getElementById('nav-close-btn');
  const drawerLinks = document.querySelectorAll('.nav-drawer-link');
  const logoBtn = document.getElementById('logo-home-btn');

  function openDrawer() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  toggleBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      closeDrawer();

      if (targetId) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Home Logo Scroll Handler
  logoBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (drawer.classList.contains('open')) closeDrawer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ESC Key to Close Drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

function initContactModule() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const reason = String(data.get("reason") || "").trim();
      const subject = String(data.get("subject") || "").trim();
      const userMessage = String(data.get("message") || "").trim();

      const formattedSubject = `[${reason}] ${subject}`;
      const formattedBody = `Name: ${name}\nEmail: ${email}\nEnquiry Type: ${reason}\n\nMessage:\n${userMessage}`;

      const mailtoUrl = "mailto:iot.club@iiits.in" +
        "?subject=" + encodeURIComponent(formattedSubject) +
        "&body=" + encodeURIComponent(formattedBody);

      const gmailWebUrl = "https://mail.google.com/mail/u/0/?view=cm&fs=1&to=" +
        encodeURIComponent("iot.club@iiits.in") +
        "&su=" + encodeURIComponent(formattedSubject) +
        "&body=" + encodeURIComponent(formattedBody);

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

      status.replaceChildren();

      if (isMobile) {
        window.location.href = mailtoUrl;

        const statusText = document.createElement("span");
        statusText.textContent = "Launching your mail app... If it didn't open automatically, ";

        const fallback = document.createElement("a");
        fallback.href = mailtoUrl;
        fallback.textContent = "tap here to open email app";
        fallback.className = "status-fallback-link";

        status.append(statusText, fallback, document.createTextNode("."));
      } else {
        const gmailWindow = window.open(gmailWebUrl, "_blank");

        const statusText = document.createElement("span");
        if (gmailWindow) {
          statusText.textContent = "Opened Gmail compose tab. If blocked by browser, ";
        } else {
          statusText.textContent = "Popup tab blocked. ";
        }

        const fallback = document.createElement("a");
        fallback.href = gmailWebUrl;
        fallback.target = "_blank";
        fallback.rel = "noopener noreferrer";
        fallback.textContent = "click here to open Gmail";
        fallback.className = "status-fallback-link";

        status.append(statusText, fallback, document.createTextNode("."));
      }

      status.classList.add("show");
    });
  }

  const clubEmailBtn = document.getElementById("clubEmailBtn");
  if (clubEmailBtn) {
    clubEmailBtn.addEventListener("click", openClubEmail);
  }
}

function openClubEmail(event) {
  event.preventDefault();
  const to = "iot.club@iiits.in";
  const subject = encodeURIComponent("Contacting ConnexIon IoT Club");
  const body = encodeURIComponent("Hello ConnexIon IoT Club,\n\n");
  const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;
  const gmailWeb = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${subject}&body=${body}`;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

  if (isMobile) {
    window.location.href = mailtoUrl;
  } else {
    const tab = window.open(gmailWeb, "_blank", "noopener");
    if (!tab) window.location.href = mailtoUrl;
  }
  return false;
}

// --- Initialize All Modules ---
window.onload = () => {
  initThemeToggle();
  initMatrixRain();
  initGlitchCanvas();
  init3D();
  initEventsModule();
  initProjectsModule();
  initTeamShowcaseModule();
  initContactModule();
  initNavigationDrawer();
};