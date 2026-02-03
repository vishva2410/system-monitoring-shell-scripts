import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const ui = {
  cityOptions: document.getElementById("city-options"),
  shipOptions: document.getElementById("ship-options"),
  themeOptions: document.getElementById("theme-options"),
  startBtn: document.getElementById("start-btn"),
  calibrateBtn: document.getElementById("calibrate-btn"),
  status: document.getElementById("status"),
  meters: document.getElementById("meters"),
  score: document.getElementById("score"),
  health: document.getElementById("health"),
  boost: document.getElementById("boost"),
  ui: document.getElementById("ui"),
  surprise: document.getElementById("surprise"),
  replayBtn: document.getElementById("replay-btn"),
  damage: document.getElementById("damage")
};

const cities = [
  { id: "nova", label: "Nova Arcology", sky: [0x05070f, 0x1d2a4a], fog: 0x0a0d1c },
  { id: "helix", label: "Helix Spire", sky: [0x0a101f, 0x172a30], fog: 0x0d131f },
  { id: "aurora", label: "Aurora Docks", sky: [0x06060f, 0x1f0f29], fog: 0x120b1c }
];

const ships = [
  { id: "swift", label: "Swift", color: 0x26f7ff },
  { id: "vanta", label: "Vanta", color: 0x7ef9ff },
  { id: "ion", label: "Ion", color: 0xff5df7 }
];

const themes = [
  { id: "neon", label: "Neon Rift", accents: [0x26f7ff, 0xff5df7] },
  { id: "ember", label: "Ember Run", accents: [0xffb347, 0xff3c7d] },
  { id: "glacier", label: "Glacier", accents: [0x6ee7ff, 0x2d6cff] }
];

const state = {
  city: cities[0],
  ship: ships[0],
  theme: themes[0],
  running: false,
  distance: 0,
  score: 0,
  health: 100,
  speed: 28,
  boost: 1,
  keys: { left: 0, right: 0, up: 0, down: 0, boost: 0 },
  steer: new THREE.Vector2(0, 0),
  invuln: 0,
  slowField: 0
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.2, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

scene.fog = new THREE.Fog(state.city.fog, 8, 36);

const ambient = new THREE.AmbientLight(0xbac7ff, 0.7);
scene.add(ambient);

const keyLight = new THREE.PointLight(0xffffff, 1.2, 40);
keyLight.position.set(0, 6, 10);
scene.add(keyLight);

const glowLight = new THREE.PointLight(state.theme.accents[0], 1.2, 30);
glowLight.position.set(-6, 3, 6);
scene.add(glowLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60, 10, 10),
  new THREE.MeshStandardMaterial({ color: 0x0b0f1f, metalness: 0.6, roughness: 0.2 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -3;
scene.add(floor);

const stars = new THREE.Group();
for (let i = 0; i < 200; i += 1) {
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  star.position.set(
    (Math.random() - 0.5) * 60,
    Math.random() * 20,
    -Math.random() * 80
  );
  stars.add(star);
}
scene.add(stars);

const tunnel = new THREE.Group();
const ringGeometry = new THREE.TorusGeometry(5.2, 0.08, 16, 64);
const ringMaterial = new THREE.MeshStandardMaterial({
  color: state.theme.accents[0],
  emissive: state.theme.accents[1],
  emissiveIntensity: 0.6,
  metalness: 0.7,
  roughness: 0.2
});

for (let i = 0; i < 18; i += 1) {
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.z = -i * 6;
  ring.rotation.x = Math.PI / 2;
  tunnel.add(ring);
}
scene.add(tunnel);

const cityStructures = new THREE.Group();
scene.add(cityStructures);

function rebuildCityStructures() {
  cityStructures.clear();
  for (let i = 0; i < 24; i += 1) {
    const height = 1.2 + Math.random() * 5;
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(0.8 + Math.random(), height, 0.8 + Math.random()),
      new THREE.MeshStandardMaterial({
        color: 0x0f1a2f,
        metalness: 0.5,
        roughness: 0.4,
        emissive: state.theme.accents[i % 2],
        emissiveIntensity: 0.12
      })
    );
    building.position.set((Math.random() - 0.5) * 18, -3 + height / 2, -8 - Math.random() * 50);
    cityStructures.add(building);
  }
}

rebuildCityStructures();

const shipGroup = new THREE.Group();
const shipBody = new THREE.Mesh(
  new THREE.ConeGeometry(0.35, 1.6, 12),
  new THREE.MeshStandardMaterial({ color: state.ship.color, metalness: 0.8, roughness: 0.2 })
);
shipBody.rotation.x = Math.PI / 2;
shipBody.position.z = 0.2;

const shipWing = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.08, 0.4),
  new THREE.MeshStandardMaterial({ color: 0x0b1224, metalness: 0.7, roughness: 0.25 })
);
shipWing.position.y = -0.1;

const shipCore = new THREE.Mesh(
  new THREE.SphereGeometry(0.22, 16, 16),
  new THREE.MeshStandardMaterial({ color: state.theme.accents[1], emissive: state.theme.accents[1] })
);
shipCore.position.z = -0.4;

const trailGroup = new THREE.Group();
for (let i = 0; i < 8; i += 1) {
  const trail = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.8),
    new THREE.MeshBasicMaterial({
      color: 0x26f7ff,
      transparent: true,
      opacity: 0.25
    })
  );
  trail.position.set(0, -0.1, -0.6 - i * 0.35);
  trail.rotation.x = Math.PI / 2;
  trailGroup.add(trail);
}

shipGroup.add(shipBody, shipWing, shipCore, trailGroup);
shipGroup.position.y = -0.4;
scene.add(shipGroup);

const obstacles = [];
const obstacleGeometry = new THREE.BoxGeometry(0.8, 0.8, 1.6);
const obstacleMaterial = new THREE.MeshStandardMaterial({
  color: 0x18213a,
  emissive: state.theme.accents[0],
  emissiveIntensity: 0.3,
  metalness: 0.4,
  roughness: 0.4
});

function spawnObstacle(zPos) {
  const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
  obstacle.position.set(
    (Math.random() - 0.5) * 6,
    (Math.random() - 0.3) * 3,
    zPos
  );
  obstacle.userData = {
    spin: (Math.random() - 0.5) * 0.02,
    drift: (Math.random() - 0.5) * 0.01
  };
  obstacles.push(obstacle);
  scene.add(obstacle);
}

for (let i = 0; i < 18; i += 1) {
  spawnObstacle(-12 - i * 5.5);
}

const gates = new THREE.Group();
const gateGeometry = new THREE.TorusGeometry(1.4, 0.12, 16, 32);
const gateMaterial = new THREE.MeshStandardMaterial({
  color: state.theme.accents[1],
  emissive: state.theme.accents[1],
  emissiveIntensity: 0.7
});

for (let i = 0; i < 10; i += 1) {
  const gate = new THREE.Mesh(gateGeometry, gateMaterial);
  gate.rotation.x = Math.PI / 2;
  gate.position.set((Math.random() - 0.5) * 5, (Math.random() - 0.2) * 2.2, -18 - i * 10);
  gate.userData = { scored: false };
  gates.add(gate);
}
scene.add(gates);

const hazards = new THREE.Group();
const hazardMaterial = new THREE.MeshStandardMaterial({
  color: 0x2e1131,
  emissive: 0xff3c7d,
  emissiveIntensity: 0.2,
  transparent: true,
  opacity: 0.3
});

for (let i = 0; i < 6; i += 1) {
  const field = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 2.4), hazardMaterial);
  field.position.set((Math.random() - 0.5) * 4.5, (Math.random() - 0.3) * 2.4, -25 - i * 18);
  hazards.add(field);
}
scene.add(hazards);

const particles = new THREE.Group();
scene.add(particles);

const nebula = new THREE.Group();
for (let i = 0; i < 12; i += 1) {
  const cloud = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 6),
    new THREE.MeshBasicMaterial({
      color: 0x1b1f3a,
      transparent: true,
      opacity: 0.2
    })
  );
  cloud.position.set((Math.random() - 0.5) * 30, Math.random() * 8, -20 - i * 12);
  cloud.rotation.z = Math.random();
  nebula.add(cloud);
}
scene.add(nebula);

function spawnSurpriseParticles() {
  particles.clear();
  for (let i = 0; i < 120; i += 1) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 10, 10),
      new THREE.MeshBasicMaterial({ color: state.theme.accents[i % 2] })
    );
    orb.position.set(
      (Math.random() - 0.5) * 8,
      Math.random() * 4 + 0.5,
      -Math.random() * 8
    );
    orb.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.08,
        Math.random() * 0.06,
        (Math.random() - 0.5) * 0.08
      )
    };
    particles.add(orb);
  }
}

function updateParticles() {
  particles.children.forEach((orb) => {
    orb.position.add(orb.userData.velocity);
    if (orb.position.y > 6) {
      orb.position.y = 0.4;
    }
  });
}

function createOptions(list, container, onSelect) {
  container.innerHTML = "";
  list.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = item.label;
    if (index === 0) btn.classList.add("active");
    btn.addEventListener("click", () => {
      container.querySelectorAll(".option").forEach((el) => el.classList.remove("active"));
      btn.classList.add("active");
      onSelect(item);
    });
    container.appendChild(btn);
  });
}

createOptions(cities, ui.cityOptions, (item) => {
  state.city = item;
  scene.fog.color.setHex(item.fog);
  document.body.style.background = `radial-gradient(circle at 20% 20%, #19233c, #06070f 70%)`;
  rebuildCityStructures();
});

createOptions(ships, ui.shipOptions, (item) => {
  state.ship = item;
  shipBody.material.color.setHex(item.color);
});

createOptions(themes, ui.themeOptions, (item) => {
  state.theme = item;
  ringMaterial.color.setHex(item.accents[0]);
  ringMaterial.emissive.setHex(item.accents[1]);
  obstacleMaterial.emissive.setHex(item.accents[0]);
  glowLight.color.setHex(item.accents[0]);
  shipCore.material.color.setHex(item.accents[1]);
  shipCore.material.emissive.setHex(item.accents[1]);
  gateMaterial.color.setHex(item.accents[1]);
  gateMaterial.emissive.setHex(item.accents[1]);
  hazardMaterial.emissive.setHex(item.accents[1]);
  rebuildCityStructures();
});

ui.startBtn.addEventListener("click", () => {
  ui.ui.style.display = "none";
  state.running = true;
  state.distance = 0;
  state.score = 0;
  state.health = 100;
  state.invuln = 0;
  state.speed = 28;
  state.slowField = 0;
  ui.surprise.classList.add("hidden");
  spawnSurpriseParticles();
  setStatus("Rift engaged.");
});

ui.replayBtn.addEventListener("click", () => {
  ui.ui.style.display = "grid";
  ui.surprise.classList.add("hidden");
  state.running = false;
  setStatus("Ready.");
});

ui.calibrateBtn.addEventListener("click", () => {
  state.steer.set(0, 0);
  shipGroup.position.x = 0;
  shipGroup.position.y = -0.4;
  setStatus("Centered.");
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function setStatus(text) {
  ui.status.textContent = text;
}

function setKeyState(code, isDown) {
  const down = isDown ? 1 : 0;
  if (code === "ArrowLeft" || code === "KeyA") state.keys.left = down;
  if (code === "ArrowRight" || code === "KeyD") state.keys.right = down;
  if (code === "ArrowUp" || code === "KeyW") state.keys.up = down;
  if (code === "ArrowDown" || code === "KeyS") state.keys.down = down;
  if (code === "Space") state.keys.boost = down;
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
    event.preventDefault();
  }
  setKeyState(event.code, true);
});

window.addEventListener("keyup", (event) => {
  setKeyState(event.code, false);
});

setStatus("Ready. Use arrow keys or WASD.");
ui.surprise.classList.add("hidden");
ui.ui.style.display = "grid";

const shipBounds = new THREE.Vector3(2.5, 1.6, 0);

function updateShip(dt) {
  const inputX = state.keys.right - state.keys.left;
  const inputY = state.keys.up - state.keys.down;
  state.steer.x = THREE.MathUtils.clamp(state.steer.x + inputX * dt * 4, -1, 1);
  state.steer.y = THREE.MathUtils.clamp(state.steer.y + inputY * dt * 4, -1, 1);
  state.steer.multiplyScalar(0.94);

  const targetX = state.steer.x * shipBounds.x;
  const targetY = state.steer.y * shipBounds.y;

  shipGroup.position.x += (targetX - shipGroup.position.x) * (0.08 + dt * 0.6);
  shipGroup.position.y += (targetY - shipGroup.position.y) * (0.08 + dt * 0.6);

  shipGroup.rotation.z = -state.steer.x * 0.6;
  shipGroup.rotation.x = state.steer.y * 0.3;
}

function updateTunnel(dt) {
  tunnel.children.forEach((ring) => {
    ring.position.z += state.speed * state.boost * dt;
    ring.rotation.z += dt * 0.5;
    if (ring.position.z > 4) {
      ring.position.z = -90;
    }
  });
}

function updateObstacles(dt) {
  obstacles.forEach((obstacle) => {
    obstacle.position.z += state.speed * state.boost * dt;
    obstacle.rotation.x += obstacle.userData.spin;
    obstacle.rotation.y += obstacle.userData.spin;
    obstacle.position.x += obstacle.userData.drift;

    if (obstacle.position.z > 6) {
      obstacle.position.z = -90 - Math.random() * 12;
      obstacle.position.x = (Math.random() - 0.5) * 6;
      obstacle.position.y = (Math.random() - 0.3) * 3;
    }
  });
}

function updateGates(dt) {
  gates.children.forEach((gate) => {
    gate.position.z += state.speed * state.boost * dt;
    gate.rotation.z += dt * 1.2;
    if (gate.position.z > 6) {
      gate.position.z = -110 - Math.random() * 25;
      gate.position.x = (Math.random() - 0.5) * 5;
      gate.position.y = (Math.random() - 0.2) * 2.2;
      gate.userData.scored = false;
    }
  });
}

function updateHazards(dt) {
  hazards.children.forEach((field) => {
    field.position.z += state.speed * state.boost * dt;
    if (field.position.z > 6) {
      field.position.z = -140 - Math.random() * 30;
      field.position.x = (Math.random() - 0.5) * 4.5;
      field.position.y = (Math.random() - 0.3) * 2.4;
    }
  });
}

function updateStars(dt) {
  stars.children.forEach((star) => {
    star.position.z += dt * 12;
    if (star.position.z > 6) {
      star.position.z = -80;
      star.position.x = (Math.random() - 0.5) * 60;
      star.position.y = Math.random() * 20;
    }
  });
}

function updateNebula(dt) {
  nebula.children.forEach((cloud) => {
    cloud.position.z += dt * 6;
    if (cloud.position.z > 8) {
      cloud.position.z = -160;
      cloud.position.x = (Math.random() - 0.5) * 30;
      cloud.position.y = Math.random() * 8;
      cloud.rotation.z = Math.random();
    }
  });
}

function updateTrail() {
  trailGroup.children.forEach((trail, index) => {
    const baseOpacity = state.boost > 1 ? 0.5 : 0.25;
    trail.material.opacity = baseOpacity * (1 - index / trailGroup.children.length);
    trail.material.color.setHex(state.theme.accents[index % 2]);
  });
}

function detectCollisions() {
  const shipPos = shipGroup.position;
  const shipRadius = 0.6;

  if (state.invuln > 0) {
    state.invuln -= 1;
  }

  obstacles.forEach((obstacle) => {
    if (Math.abs(obstacle.position.z - shipPos.z) < 1.2) {
      const dx = obstacle.position.x - shipPos.x;
      const dy = obstacle.position.y - shipPos.y;
      if (Math.hypot(dx, dy) < shipRadius + 0.4 && state.invuln <= 0) {
        state.health = Math.max(0, state.health - 12);
        state.invuln = 30;
        ui.damage.classList.add("active");
        setTimeout(() => ui.damage.classList.remove("active"), 180);
        obstacle.position.z = -120 - Math.random() * 12;
      }
    }
  });

  gates.children.forEach((gate) => {
    if (!gate.userData.scored && Math.abs(gate.position.z - shipPos.z) < 1) {
      const dx = gate.position.x - shipPos.x;
      const dy = gate.position.y - shipPos.y;
      if (Math.hypot(dx, dy) < 1.2) {
        gate.userData.scored = true;
        state.score += 120;
      }
    }
  });

  let inHazard = false;
  hazards.children.forEach((field) => {
    if (Math.abs(field.position.z - shipPos.z) < 1.2) {
      const dx = field.position.x - shipPos.x;
      const dy = field.position.y - shipPos.y;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 1) {
        inHazard = true;
      }
    }
  });
  state.slowField = inHazard ? 0.6 : 0;
}

function checkCompletion() {
  if (state.distance > 1500) {
    state.running = false;
    ui.surprise.classList.remove("hidden");
    ui.boost.classList.remove("active");
    setStatus("Rift complete.");
  }
  if (state.health <= 0) {
    state.running = false;
    ui.surprise.classList.remove("hidden");
    ui.boost.classList.remove("active");
    setStatus("Hull lost. Try again.");
  }
}

let lastTime = performance.now();
function animate(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.04);
  lastTime = time;

  if (state.running) {
    state.boost = state.keys.boost ? 1.7 : 1;
    const slow = state.slowField > 0 ? 0.55 : 1;
    state.distance += state.speed * state.boost * dt * slow;
    state.score += Math.floor(state.speed * state.boost * dt * 6);
    ui.meters.textContent = `${Math.floor(state.distance)} m`;
    ui.score.textContent = `Score ${state.score}`;
    ui.health.textContent = `Hull ${state.health}%`;
    ui.boost.classList.toggle("active", state.boost > 1);

    updateShip(dt);
    updateTunnel(dt);
    updateObstacles(dt);
    updateGates(dt);
    updateHazards(dt);
    updateStars(dt);
    updateNebula(dt);
    updateParticles();
    updateTrail();
    detectCollisions();
    checkCompletion();
  } else {
    shipGroup.rotation.y += dt * 0.2;
    updateParticles();
    updateNebula(dt);
    updateTrail();
  }

  if (state.hasHands && performance.now() - state.lastHandSeen > 1000) {
    state.hasHands = false;
    setStatus("Hand lost — using mouse.");
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
