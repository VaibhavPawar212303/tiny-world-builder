export interface Voxel {
  x: number;
  y: number;
  z: number;
  color: string;
}

export class VoxelGrid {
  private voxels: Map<string, Voxel> = new Map();
  readonly size: number;
  readonly maxHeight: number;

  constructor(size: number = 16, maxHeight: number = 16) {
    this.size = size;
    this.maxHeight = maxHeight;
  }

  private getKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  private isInBounds(x: number, y: number, z: number): boolean {
    return (
      x >= 0 &&
      x < this.size &&
      y >= 0 &&
      y < this.maxHeight &&
      z >= 0 &&
      z < this.size
    );
  }

  setVoxel(x: number, y: number, z: number, color: string): boolean {
    if (!this.isInBounds(x, y, z)) return false;
    const key = this.getKey(x, y, z);
    this.voxels.set(key, { x, y, z, color });
    return true;
  }

  removeVoxel(x: number, y: number, z: number): boolean {
    if (!this.isInBounds(x, y, z)) return false;
    const key = this.getKey(x, y, z);
    return this.voxels.delete(key);
  }

  getVoxel(x: number, y: number, z: number): Voxel | undefined {
    const key = this.getKey(x, y, z);
    return this.voxels.get(key);
  }

  hasVoxel(x: number, y: number, z: number): boolean {
    const key = this.getKey(x, y, z);
    return this.voxels.has(key);
  }

  getAllVoxels(): Voxel[] {
    return Array.from(this.voxels.values());
  }

  clear(): void {
    this.voxels.clear();
  }

  toJSON(): Voxel[] {
    return this.getAllVoxels();
  }

  fromJSON(data: Voxel[]): void {
    this.clear();
    data.forEach((voxel) => {
      this.setVoxel(voxel.x, voxel.y, voxel.z, voxel.color);
    });
  }

  getStats() {
    return {
      voxelCount: this.voxels.size,
      maxCapacity: this.size * this.size * this.maxHeight,
    };
  }
}
