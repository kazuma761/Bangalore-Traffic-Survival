import * as THREE from 'three';
import { SizeTier } from './SizeTier.ts';

/** All procedural asset generators - no external models needed for MVP */

export interface CityObject {
  mesh: THREE.Group;
  tier: SizeTier;
  points: number;
  volume: number;
  name: string;
  objectRadius: number; // Visual radius of the object - hole must be bigger than this to eat it
}

const COLORS = {
  rickshawGreen: 0x2e7d32,
  rickshawBlack: 0x212121,
  rickshawYellow: 0xffc107,
  bmtcRed: 0xc62828,
  bmtcBlue: 0x1565c0,
  buildingWhite: 0xeceff1,
  buildingGray: 0x78909c,
  buildingBrown: 0x8d6e63,
  treeTrunk: 0x5d4037,
  treeGreen: 0x388e3c,
  treeDarkGreen: 0x1b5e20,
  coneOrange: 0xff6d00,
  personSkin: 0xffcc80,
  personClothes: [0xe91e63, 0x2196f3, 0x4caf50, 0xff9800, 0x9c27b0],
  cartWood: 0x8d6e63,
  cartRed: 0xef5350,
  vidhanaGray: 0x90a4ae,
  vidhanaDome: 0x78909c,
  palaceYellow: 0xffd54f,
  iskconWhite: 0xfafafa,
  iskconGold: 0xffc107,
  lampPostGray: 0x616161,
  lampYellow: 0xffee58,
  itParkBlue: 0x42a5f5,
  itParkGlass: 0xbbdefb,
};

function createMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8 });
}

// ===== TIER XS (Traffic cones, plants, food carts, lamp posts) =====

export function createTrafficCone(): CityObject {
  const group = new THREE.Group();
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.5, 6),
    createMaterial(COLORS.coneOrange)
  );
  cone.position.y = 0.25;
  group.add(cone);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.05, 0.35),
    createMaterial(0x333333)
  );
  base.position.y = 0.025;
  group.add(base);

  return { mesh: group, tier: SizeTier.XS, points: 10, volume: 1, name: 'Traffic Cone', objectRadius: 0.2 };
}

export function createPlant(): CityObject {
  const group = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 0.25, 6),
    createMaterial(COLORS.cartRed)
  );
  pot.position.y = 0.125;
  group.add(pot);

  const bush = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 6, 4),
    createMaterial(COLORS.treeGreen)
  );
  bush.position.y = 0.45;
  group.add(bush);

  return { mesh: group, tier: SizeTier.XS, points: 10, volume: 1, name: 'Plant', objectRadius: 0.3 };
}

export function createFoodCart(): CityObject {
  const group = new THREE.Group();
  // Cart body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.5, 0.5),
    createMaterial(COLORS.cartWood)
  );
  body.position.y = 0.45;
  group.add(body);

  // Wheels
  for (const xOff of [-0.3, 0.3]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8),
      createMaterial(0x333333)
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(xOff, 0.12, 0.28);
    group.add(wheel);
  }

  // Umbrella
  const umbrella = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 0.3, 8),
    createMaterial(COLORS.cartRed)
  );
  umbrella.position.y = 1.0;
  group.add(umbrella);

  return { mesh: group, tier: SizeTier.XS, points: 15, volume: 2, name: 'Food Cart', objectRadius: 0.5 };
}

export function createLampPost(): CityObject {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 1.5, 6),
    createMaterial(COLORS.lampPostGray)
  );
  pole.position.y = 0.75;
  group.add(pole);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 6, 4),
    createMaterial(COLORS.lampYellow)
  );
  lamp.position.y = 1.55;
  group.add(lamp);

  return { mesh: group, tier: SizeTier.XS, points: 10, volume: 1, name: 'Lamp Post', objectRadius: 0.15 };
}

// ===== TIER S (People, benches, motorcycles, small trees) =====

export function createPerson(): CityObject {
  const group = new THREE.Group();
  const clothColor = COLORS.personClothes[Math.floor(Math.random() * COLORS.personClothes.length)];

  // Body
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.15, 0.5, 4, 6),
    createMaterial(clothColor)
  );
  body.position.y = 0.6;
  group.add(body);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 6, 4),
    createMaterial(COLORS.personSkin)
  );
  head.position.y = 1.05;
  group.add(head);

  return { mesh: group, tier: SizeTier.S, points: 25, volume: 3, name: 'Person', objectRadius: 0.2 };
}

export function createSmallTree(): CityObject {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 1.0, 6),
    createMaterial(COLORS.treeTrunk)
  );
  trunk.position.y = 0.5;
  group.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.6, 1.2, 6),
    createMaterial(COLORS.treeGreen)
  );
  canopy.position.y = 1.5;
  group.add(canopy);

  return { mesh: group, tier: SizeTier.S, points: 20, volume: 4, name: 'Tree', objectRadius: 0.6 };
}

export function createBench(): CityObject {
  const group = new THREE.Group();
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.06, 0.3),
    createMaterial(COLORS.cartWood)
  );
  seat.position.y = 0.35;
  group.add(seat);

  // Legs
  for (const x of [-0.35, 0.35]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.35, 0.25),
      createMaterial(0x424242)
    );
    leg.position.set(x, 0.175, 0);
    group.add(leg);
  }

  // Back
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.4, 0.04),
    createMaterial(COLORS.cartWood)
  );
  back.position.set(0, 0.55, -0.13);
  group.add(back);

  return { mesh: group, tier: SizeTier.S, points: 20, volume: 3, name: 'Bench', objectRadius: 0.5 };
}

// ===== TIER M (Auto-rickshaws, cars, bus stops) =====

export function createAutoRickshaw(): CityObject {
  const group = new THREE.Group();

  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.7, 0.7),
    createMaterial(COLORS.rickshawGreen)
  );
  body.position.y = 0.55;
  group.add(body);

  // Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.08, 0.65),
    createMaterial(COLORS.rickshawBlack)
  );
  roof.position.y = 0.95;
  group.add(roof);

  // Front (pointed)
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.5, 0.5),
    createMaterial(COLORS.rickshawGreen)
  );
  front.position.set(0.55, 0.45, 0);
  group.add(front);

  // Headlight
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 6, 4),
    createMaterial(COLORS.rickshawYellow)
  );
  light.position.set(0.7, 0.5, 0);
  group.add(light);

  // Wheels (3 wheels - front 1, rear 2)
  const wheelMat = createMaterial(0x212121);
  const wheelGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 8);

  const frontWheel = new THREE.Mesh(wheelGeom, wheelMat);
  frontWheel.rotation.z = Math.PI / 2;
  frontWheel.position.set(0.55, 0.12, 0);
  group.add(frontWheel);

  for (const zOff of [-0.35, 0.35]) {
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(-0.2, 0.12, zOff);
    group.add(wheel);
  }

  return { mesh: group, tier: SizeTier.M, points: 50, volume: 12, name: 'Auto Rickshaw', objectRadius: 0.7 };
}

export function createCar(): CityObject {
  const group = new THREE.Group();
  const carColors = [0x1565c0, 0xc62828, 0xf5f5f5, 0x424242, 0xff8f00];
  const color = carColors[Math.floor(Math.random() * carColors.length)];

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.5, 0.8),
    createMaterial(color)
  );
  body.position.y = 0.4;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.4, 0.75),
    createMaterial(0xbbdefb)
  );
  cabin.position.set(-0.1, 0.8, 0);
  group.add(cabin);

  const wheelMat = createMaterial(0x212121);
  const wheelGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 8);
  for (const x of [-0.5, 0.5]) {
    for (const z of [-0.4, 0.4]) {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.15, z);
      group.add(wheel);
    }
  }

  return { mesh: group, tier: SizeTier.M, points: 40, volume: 15, name: 'Car', objectRadius: 0.9 };
}

// ===== TIER L (BMTC bus, small buildings) =====

export function createBMTCBus(): CityObject {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 1.2, 1.2),
    createMaterial(COLORS.bmtcRed)
  );
  body.position.y = 1.0;
  group.add(body);

  // Blue stripe
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(3.52, 0.25, 1.22),
    createMaterial(COLORS.bmtcBlue)
  );
  stripe.position.y = 0.6;
  group.add(stripe);

  // Windows
  const windowMat = createMaterial(0xbbdefb);
  const windowGeom = new THREE.BoxGeometry(0.3, 0.35, 1.22);
  for (let i = -1.2; i <= 1.2; i += 0.5) {
    const win = new THREE.Mesh(windowGeom, windowMat);
    win.position.set(i, 1.2, 0);
    group.add(win);
  }

  // Wheels
  const wheelMat = createMaterial(0x212121);
  const wheelGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8);
  for (const x of [-1.2, 1.2]) {
    for (const z of [-0.6, 0.6]) {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.25, z);
      group.add(wheel);
    }
  }

  return { mesh: group, tier: SizeTier.L, points: 100, volume: 50, name: 'BMTC Bus', objectRadius: 1.8 };
}

export function createSmallBuilding(): CityObject {
  const group = new THREE.Group();
  const height = 2 + Math.random() * 3;
  const colors = [COLORS.buildingWhite, COLORS.buildingGray, COLORS.buildingBrown, 0xffe0b2, 0xc8e6c9];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, height, 2),
    createMaterial(color)
  );
  body.position.y = height / 2;
  group.add(body);

  // Windows
  const windowMat = createMaterial(0x90caf9);
  for (let y = 0.8; y < height - 0.3; y += 0.8) {
    for (const z of [-0.6, 0, 0.6]) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.35, 0.25),
        windowMat
      );
      win.position.set(1.01, y, z);
      group.add(win);

      const win2 = win.clone();
      win2.position.set(-1.01, y, z);
      group.add(win2);
    }
  }

  return { mesh: group, tier: SizeTier.L, points: 80, volume: 40, name: 'Building', objectRadius: 1.5 };
}

// ===== TIER XL (Landmarks) =====

export function createVidhanaSoudha(): CityObject {
  const group = new THREE.Group();

  // Main building body
  const mainBody = new THREE.Mesh(
    new THREE.BoxGeometry(8, 3, 5),
    createMaterial(COLORS.vidhanaGray)
  );
  mainBody.position.y = 1.5;
  group.add(mainBody);

  // Upper section
  const upper = new THREE.Mesh(
    new THREE.BoxGeometry(6, 1.5, 4),
    createMaterial(COLORS.vidhanaGray)
  );
  upper.position.y = 3.75;
  group.add(upper);

  // Central dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    createMaterial(COLORS.vidhanaDome)
  );
  dome.position.y = 4.5;
  group.add(dome);

  // Columns (simplified Dravidian pillars)
  const colMat = createMaterial(0xb0bec5);
  for (let x = -3; x <= 3; x += 1) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 3, 6),
      colMat
    );
    col.position.set(x, 1.5, 2.55);
    group.add(col);
  }

  // Steps
  const steps = new THREE.Mesh(
    new THREE.BoxGeometry(8.5, 0.4, 2),
    createMaterial(0xcfd8dc)
  );
  steps.position.set(0, 0.2, 3.5);
  group.add(steps);

  return { mesh: group, tier: SizeTier.XL, points: 500, volume: 200, name: 'Vidhana Soudha', objectRadius: 5.0 };
}

export function createBangalorePalace(): CityObject {
  const group = new THREE.Group();

  // Main body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(6, 3, 4),
    createMaterial(COLORS.palaceYellow)
  );
  body.position.y = 1.5;
  group.add(body);

  // Towers at corners
  const towerMat = createMaterial(0xffc107);
  for (const x of [-2.8, 2.8]) {
    for (const z of [-1.8, 1.8]) {
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 4.5, 6),
        towerMat
      );
      tower.position.set(x, 2.25, z);
      group.add(tower);

      // Tower top
      const top = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 1, 6),
        createMaterial(0xd32f2f)
      );
      top.position.set(x, 5, z);
      group.add(top);
    }
  }

  // Central tower
  const centralTower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 5.5, 8),
    towerMat
  );
  centralTower.position.y = 2.75;
  group.add(centralTower);

  const centralTop = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 1.2, 8),
    createMaterial(0xd32f2f)
  );
  centralTop.position.y = 6.1;
  group.add(centralTop);

  return { mesh: group, tier: SizeTier.XL, points: 500, volume: 200, name: 'Bangalore Palace', objectRadius: 4.0 };
}

export function createISKCONTemple(): CityObject {
  const group = new THREE.Group();

  // Base platform
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(5, 0.5, 5),
    createMaterial(COLORS.iskconWhite)
  );
  base.position.y = 0.25;
  group.add(base);

  // Main body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(4, 3, 4),
    createMaterial(COLORS.iskconWhite)
  );
  body.position.y = 2;
  group.add(body);

  // Central spire (gopuram-style)
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 4, 8),
    createMaterial(COLORS.iskconGold)
  );
  spire.position.y = 5.5;
  group.add(spire);

  // Side spires
  for (const x of [-1.5, 1.5]) {
    const sideSpire = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 2.5, 6),
      createMaterial(COLORS.iskconGold)
    );
    sideSpire.position.set(x, 4.75, 0);
    group.add(sideSpire);
  }

  // Dome finial on top
  const finial = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 6),
    createMaterial(COLORS.iskconGold)
  );
  finial.position.y = 7.7;
  group.add(finial);

  return { mesh: group, tier: SizeTier.XL, points: 500, volume: 200, name: 'ISKCON Temple', objectRadius: 3.5 };
}

export function createITPark(): CityObject {
  const group = new THREE.Group();
  const height = 5 + Math.random() * 3;

  // Glass tower
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3, height, 3),
    createMaterial(COLORS.itParkGlass)
  );
  body.position.y = height / 2;
  group.add(body);

  // Dark window grid lines
  const lineMat = createMaterial(COLORS.itParkBlue);
  for (let y = 0.5; y < height; y += 1) {
    const hLine = new THREE.Mesh(
      new THREE.BoxGeometry(3.02, 0.04, 3.02),
      lineMat
    );
    hLine.position.y = y;
    group.add(hLine);
  }

  return { mesh: group, tier: SizeTier.L, points: 120, volume: 60, name: 'IT Park', objectRadius: 2.0 };
}

/** Large banyan tree */
export function createBanyanTree(): CityObject {
  const group = new THREE.Group();

  // Thick trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.5, 2, 8),
    createMaterial(COLORS.treeTrunk)
  );
  trunk.position.y = 1;
  group.add(trunk);

  // Wide canopy
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 8, 6),
    createMaterial(COLORS.treeDarkGreen)
  );
  canopy.position.y = 2.8;
  canopy.scale.set(1, 0.6, 1);
  group.add(canopy);

  // Aerial roots
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const root = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.5, 4),
      createMaterial(COLORS.treeTrunk)
    );
    root.position.set(Math.cos(angle) * 1, 1.2, Math.sin(angle) * 1);
    group.add(root);
  }

  return { mesh: group, tier: SizeTier.M, points: 35, volume: 10, name: 'Banyan Tree', objectRadius: 1.8 };
}

/** Lalbagh Glasshouse - iconic Victorian glass structure */
export function createLalbagh(): CityObject {
  const group = new THREE.Group();

  // Base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.4, 4),
    createMaterial(0xcfd8dc)
  );
  base.position.y = 0.2;
  group.add(base);

  // Glass walls (transparent)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xb3e5fc,
    transparent: true,
    opacity: 0.4,
    flatShading: true,
    roughness: 0.1,
    metalness: 0.3,
  });

  const wallGeom = new THREE.BoxGeometry(5.5, 2, 3.5);
  const walls = new THREE.Mesh(wallGeom, glassMat);
  walls.position.y = 1.4;
  group.add(walls);

  // Arched roof (half cylinder)
  const roofGeom = new THREE.CylinderGeometry(2, 2, 5.5, 12, 1, false, 0, Math.PI);
  const roof = new THREE.Mesh(roofGeom, glassMat);
  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  roof.position.y = 2.4;
  group.add(roof);

  // Metal frame ribs
  const frameMat = createMaterial(0x546e7a);
  for (let x = -2; x <= 2; x += 1) {
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.04, 4, 12, Math.PI),
      frameMat
    );
    rib.position.set(x, 2.4, 0);
    group.add(rib);
  }

  return { mesh: group, tier: SizeTier.XL, points: 500, volume: 200, name: 'Lalbagh Glasshouse', objectRadius: 4.0 };
}

/** Filter coffee shop - Bangalore's coffee culture */
export function createCoffeeShop(): CityObject {
  const group = new THREE.Group();

  // Building
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.2, 1.2),
    createMaterial(0x4e342e) // Dark brown
  );
  body.position.y = 0.6;
  group.add(body);

  // Sign board
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.3, 0.05),
    createMaterial(0xffcc02) // Yellow sign
  );
  sign.position.set(0, 1.4, 0.63);
  group.add(sign);

  // Awning
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.05, 0.6),
    createMaterial(0xd32f2f) // Red awning
  );
  awning.position.set(0, 1.15, 0.9);
  awning.rotation.x = 0.15;
  group.add(awning);

  // Small table outside
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.4, 6),
    createMaterial(0x8d6e63)
  );
  table.position.set(0.5, 0.2, 1.0);
  group.add(table);

  return { mesh: group, tier: SizeTier.S, points: 30, volume: 5, name: 'Coffee Shop', objectRadius: 0.8 };
}

/** Motorcycle / two-wheeler */
export function createMotorcycle(): CityObject {
  const group = new THREE.Group();

  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.3, 0.25),
    createMaterial(0x212121)
  );
  body.position.y = 0.35;
  group.add(body);

  // Seat
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.08, 0.2),
    createMaterial(0x424242)
  );
  seat.position.set(-0.1, 0.55, 0);
  group.add(seat);

  // Front fork
  const fork = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4),
    createMaterial(0x757575)
  );
  fork.position.set(0.3, 0.35, 0);
  fork.rotation.z = 0.3;
  group.add(fork);

  // Wheels
  const wheelMat = createMaterial(0x333333);
  for (const x of [-0.25, 0.3]) {
    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.03, 6, 12),
      wheelMat
    );
    wheel.position.set(x, 0.15, 0);
    group.add(wheel);
  }

  // Headlight
  const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 6, 4),
    createMaterial(0xffee58)
  );
  headlight.position.set(0.38, 0.5, 0);
  group.add(headlight);

  return { mesh: group, tier: SizeTier.S, points: 30, volume: 4, name: 'Motorcycle', objectRadius: 0.4 };
}

/** Namma Metro pillar */
export function createMetroPillar(): CityObject {
  const group = new THREE.Group();

  // Pillar
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 4, 8),
    createMaterial(0x78909c)
  );
  pillar.position.y = 2;
  group.add(pillar);

  // Top beam
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.5, 1.5),
    createMaterial(0x90a4ae)
  );
  beam.position.y = 4.25;
  group.add(beam);

  // Purple metro accent
  const accent = new THREE.Mesh(
    new THREE.BoxGeometry(3.02, 0.15, 1.52),
    createMaterial(0x7b1fa2) // Namma Metro purple
  );
  accent.position.y = 4.05;
  group.add(accent);

  return { mesh: group, tier: SizeTier.L, points: 90, volume: 45, name: 'Metro Pillar', objectRadius: 1.5 };
}
