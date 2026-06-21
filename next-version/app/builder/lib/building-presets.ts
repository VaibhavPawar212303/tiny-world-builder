import type { Voxel } from './voxel-grid';

export type BuildingType = 'house' | 'cabin' | 'tower' | 'barn' | 'church' | 'well' | 'bridge';

interface BuildingPreset {
  name: string;
  description: string;
  voxels: Voxel[];
  width: number;
  depth: number;
  height: number;
}

const COLORS = {
  wall: 'red',
  roof: 'blue',
  door: 'yellow',
  window: 'green',
  chimney: 'purple',
  wood: 'brown',
  stone: 'gray',
};

// Build a simple structure by creating voxel layers
function fillBox(x: number, y: number, z: number, w: number, d: number, h: number, color: string): Voxel[] {
  const voxels: Voxel[] = [];
  for (let ix = x; ix < x + w; ix++) {
    for (let iy = y; iy < y + h; iy++) {
      for (let iz = z; iz < z + d; iz++) {
        voxels.push({ x: ix, y: iy, z: iz, color });
      }
    }
  }
  return voxels;
}

function createWalls(x: number, y: number, z: number, w: number, d: number, h: number): Voxel[] {
  const voxels: Voxel[] = [];

  // Four walls
  for (let ix = x; ix < x + w; ix++) {
    for (let iy = y; iy < y + h; iy++) {
      // Front and back walls
      voxels.push({ x: ix, y: iy, z: z, color: COLORS.wall });
      voxels.push({ x: ix, y: iy, z: z + d - 1, color: COLORS.wall });
    }
  }

  for (let iz = z + 1; iz < z + d - 1; iz++) {
    for (let iy = y; iy < y + h; iy++) {
      // Left and right walls
      voxels.push({ x: x, y: iy, z: iz, color: COLORS.wall });
      voxels.push({ x: x + w - 1, y: iy, z: iz, color: COLORS.wall });
    }
  }

  return voxels;
}

function createRoof(x: number, y: number, z: number, w: number, d: number): Voxel[] {
  const voxels: Voxel[] = [];
  const h = y + 1;

  // Pitched roof - two slabs meeting at peak
  for (let ix = x; ix < x + w; ix++) {
    for (let iz = z; iz < z + d; iz++) {
      if (ix < x + w / 2) {
        voxels.push({ x: ix, y: h, z: iz, color: COLORS.roof });
        voxels.push({ x: ix, y: h + 1, z: iz, color: COLORS.roof });
      } else if (ix > x + w / 2) {
        voxels.push({ x: ix, y: h, z: iz, color: COLORS.roof });
        voxels.push({ x: ix, y: h + 1, z: iz, color: COLORS.roof });
      } else {
        voxels.push({ x: ix, y: h + 1, z: iz, color: COLORS.roof });
      }
    }
  }

  return voxels;
}

function addDoor(x: number, y: number, z: number, voxels: Voxel[]): Voxel[] {
  return [
    ...voxels,
    { x, y: y + 1, z, color: COLORS.door },
    { x, y: y + 2, z, color: COLORS.door },
  ];
}

function addWindow(x: number, y: number, z: number, voxels: Voxel[]): Voxel[] {
  return [
    ...voxels,
    { x, y: y + 2, z, color: COLORS.window },
    { x: x + 1, y: y + 2, z, color: COLORS.window },
  ];
}

function addChimney(x: number, y: number, z: number, voxels: Voxel[]): Voxel[] {
  return [
    ...voxels,
    { x, y: y + 2, z, color: COLORS.chimney },
    { x, y: y + 3, z, color: COLORS.chimney },
    { x, y: y + 4, z, color: COLORS.chimney },
  ];
}

export const BUILDING_PRESETS: Record<BuildingType, BuildingPreset> = {
  house: {
    name: 'House',
    description: 'Classic cottage with pitched roof',
    width: 5,
    depth: 4,
    height: 4,
    voxels: (() => {
      let v: Voxel[] = [];
      // Walls
      v = [...v, ...createWalls(0, 0, 0, 5, 4, 3)];
      // Roof
      v = [...v, ...createRoof(0, 3, 0, 5, 4)];
      // Door on front
      v = addDoor(2, 0, 0, v);
      // Windows
      v = addWindow(1, 0, 0, v);
      v = addWindow(3, 0, 0, v);
      // Chimney on side
      v = addChimney(4, 0, 2, v);
      return v;
    })(),
  },

  cabin: {
    name: 'Cabin',
    description: 'Cozy log cabin',
    width: 4,
    depth: 3,
    height: 3,
    voxels: (() => {
      let v: Voxel[] = [];
      // Walls
      v = [...v, ...createWalls(0, 0, 0, 4, 3, 2)];
      // Roof
      v = [...v, ...createRoof(0, 2, 0, 4, 3)];
      // Door
      v = addDoor(1, 0, 0, v);
      // Window
      v = addWindow(2, 0, 0, v);
      return v;
    })(),
  },

  tower: {
    name: 'Tower',
    description: 'Tall stone tower',
    width: 3,
    depth: 3,
    height: 6,
    voxels: (() => {
      let v: Voxel[] = [];
      // Walls - taller
      v = [...v, ...createWalls(0, 0, 0, 3, 3, 5)];
      // Roof
      v = [...v, ...createRoof(0, 5, 0, 3, 3)];
      // Windows on each level
      for (let level = 1; level <= 4; level += 2) {
        v = addWindow(1, level, 0, v);
      }
      return v;
    })(),
  },

  barn: {
    name: 'Barn',
    description: 'Large barn structure',
    width: 6,
    depth: 5,
    height: 3,
    voxels: (() => {
      let v: Voxel[] = [];
      // Walls
      v = [...v, ...createWalls(0, 0, 0, 6, 5, 3)];
      // Roof
      v = [...v, ...createRoof(0, 3, 0, 6, 5)];
      // Large door on front
      v = addDoor(2, 0, 0, v);
      v = addDoor(3, 0, 0, v);
      // Side doors
      v = addDoor(0, 0, 2, v);
      return v;
    })(),
  },

  church: {
    name: 'Church',
    description: 'Church with steeple',
    width: 4,
    depth: 6,
    height: 4,
    voxels: (() => {
      let v: Voxel[] = [];
      // Main walls
      v = [...v, ...createWalls(0, 0, 0, 4, 6, 3)];
      // Roof
      v = [...v, ...createRoof(0, 3, 0, 4, 6)];
      // Steeple (tall tower at front)
      v = [...v, ...fillBox(1, 3, 0, 2, 1, 2, COLORS.roof)];
      // Door at front
      v = addDoor(1, 0, 0, v);
      // Windows along sides
      v = addWindow(0, 2, 1, v);
      v = addWindow(0, 2, 3, v);
      v = addWindow(3, 2, 1, v);
      v = addWindow(3, 2, 3, v);
      return v;
    })(),
  },

  well: {
    name: 'Well',
    description: 'Water well structure',
    width: 2,
    depth: 2,
    height: 2,
    voxels: (() => {
      let v: Voxel[] = [];
      // Walls - just the rim
      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          v.push({ x, y, z: 0, color: COLORS.stone });
          v.push({ x, y, z: 1, color: COLORS.stone });
        }
      }
      return v;
    })(),
  },

  bridge: {
    name: 'Bridge',
    description: 'Simple wooden bridge',
    width: 3,
    depth: 5,
    height: 1,
    voxels: (() => {
      let v: Voxel[] = [];
      // Deck
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 5; z++) {
          v.push({ x, y: 0, z, color: COLORS.wood });
        }
      }
      // Railings on sides
      for (let z = 0; z < 5; z++) {
        v.push({ x: 0, y: 1, z, color: COLORS.wood });
        v.push({ x: 2, y: 1, z, color: COLORS.wood });
      }
      return v;
    })(),
  },
};

export function getBuilding(type: BuildingType): BuildingPreset {
  return BUILDING_PRESETS[type];
}

export function placeBuilding(
  building: BuildingPreset,
  baseX: number,
  baseY: number,
  baseZ: number
): Voxel[] {
  return building.voxels.map((v) => ({
    ...v,
    x: v.x + baseX,
    y: v.y + baseY,
    z: v.z + baseZ,
  }));
}
