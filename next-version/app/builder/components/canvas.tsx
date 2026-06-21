'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VoxelGrid, type Voxel, type GridSize } from '../lib/voxel-grid';
import { UndoManager, type Action } from '../lib/undo-manager';
import { BUILDING_PRESETS, placeBuilding } from '../lib/building-presets';
import { getTool, type Tool } from '../lib/tools';

const COLORS: Record<string, number> = {
  red: 0xff6b6b,
  blue: 0x4ecdc4,
  green: 0x95e1d3,
  yellow: 0xffe66d,
  purple: 0xc7b3e5,
  brown: 0x8b5a32,
  gray: 0x8f8a82,
};

const COLOR_NAMES = ['red', 'blue', 'green', 'yellow', 'purple'];
const COLOR_TO_INDEX: Record<string, number> = {
  red: 1,
  blue: 2,
  green: 3,
  yellow: 4,
  purple: 5,
};

interface CanvasProps {
  onVoxelUpdate?: (voxels: Voxel[]) => void;
  initialVoxels?: Voxel[];
  gridSize?: GridSize;
  selectedTool?: Tool | null;
}

export function Canvas({ onVoxelUpdate, initialVoxels, gridSize = 16, selectedTool }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridRef = useRef<VoxelGrid>(new VoxelGrid(gridSize, gridSize));
  const undoManagerRef = useRef<UndoManager>(new UndoManager());
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const keyStateRef = useRef<Record<string, boolean>>({});
  const cameraStateRef = useRef({ movingForward: false, movingBack: false, movingLeft: false, movingRight: false });

  const [selectedColor, setSelectedColor] = useState<string>('red');
  const [eraseMode, setEraseMode] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const centerX = gridSize / 2;
    const centerZ = gridSize / 2;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(centerX + 20, 15, centerZ + 20);
    camera.lookAt(centerX, 4, centerZ);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(centerX + 20, 30, centerZ + 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -gridSize * 2;
    directionalLight.shadow.camera.right = gridSize * 2;
    directionalLight.shadow.camera.top = gridSize * 2;
    directionalLight.shadow.camera.bottom = -gridSize * 2;
    scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(gridSize * 2, gridSize * 2);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(gridSize * 2, gridSize / 2, 0x444444, 0x222222);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Load initial voxels
    if (initialVoxels) {
      gridRef.current.fromJSON(initialVoxels);
      redrawVoxels(scene);
    }

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging && e.buttons === 2) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        const camera = cameraRef.current!;
        const spherical = new THREE.Spherical().setFromVector3(
          camera.position.clone().sub(new THREE.Vector3(centerX, 4, centerZ))
        );

        spherical.theta -= deltaX * 0.01;
        spherical.phi -= deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        const offset = new THREE.Vector3().setFromSpherical(spherical);
        camera.position.copy(new THREE.Vector3(centerX, 4, centerZ).add(offset));
        camera.lookAt(centerX, 4, centerZ);
      }
      previousMousePosition = { x: e.clientX, y: e.clientY };

      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();

      const toolId = e.dataTransfer?.getData('tool-id');
      const variantId = e.dataTransfer?.getData('variant-id');

      if (!toolId) return;

      // Get the tool
      const tool = getTool(toolId);
      if (!tool) return;

      // Check if it's a building tool
      const isBuilding = tool.kind === 'house' || tool.kind === 'fence' || tool.kind === 'bridge';
      if (!isBuilding) return;

      // Get mouse position on canvas
      const rect = containerRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouseRef.current.x = (x / rect.width) * 2 - 1;
      mouseRef.current.y = -(y / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!);

      // Create a plane at ground level to find where to place building
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycasterRef.current.ray.intersectPlane(groundPlane, intersection);

      // Round to grid coordinates
      const baseX = Math.floor(intersection.x);
      const baseZ = Math.floor(intersection.z);
      const baseY = 0;

      // Place the building voxels
      let buildingVoxels: Voxel[] = [];

      if (tool.kind === 'house') {
        const variant = tool.variants?.find(v => v.id === variantId);
        const buildingType = variant?.buildingType || 'house';
        const preset = BUILDING_PRESETS[buildingType as keyof typeof BUILDING_PRESETS];
        if (preset) {
          buildingVoxels = placeBuilding(preset, baseX, baseY, baseZ);
        }
      } else if (tool.kind === 'fence') {
        // Simple fence placement (2 voxels)
        buildingVoxels = [
          { x: baseX, y: baseY, z: baseZ, color: 'red' },
          { x: baseX + 1, y: baseY, z: baseZ, color: 'red' },
        ];
      } else if (tool.kind === 'bridge') {
        // Simple bridge (3x5)
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 5; j++) {
            buildingVoxels.push({ x: baseX + i, y: baseY, z: baseZ + j, color: 'purple' });
          }
        }
      }

      // Add building voxels to grid
      buildingVoxels.forEach(voxel => {
        gridRef.current.setVoxel(voxel.x, voxel.y, voxel.z, voxel.color);
        undoManagerRef.current.push({
          type: 'place',
          x: voxel.x,
          y: voxel.y,
          z: voxel.z,
          color: voxel.color,
        });
      });

      setUndoCount(undoManagerRef.current.getStats().undoCount);
      setRedoCount(undoManagerRef.current.getStats().redoCount);
      redrawVoxels(scene);
      onVoxelUpdate?.(gridRef.current.getAllVoxels());
    };

    const onClick = (e: MouseEvent) => {
      if (isDragging) return;

      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!);

      if (instancedMeshRef.current) {
        const intersects = raycasterRef.current.intersectObject(instancedMeshRef.current);

        if (intersects.length > 0) {
          const intersection = intersects[0];
          const index = intersection.instanceId;
          if (index !== undefined && instancedMeshRef.current.userData.voxelMap) {
            const voxelMap = instancedMeshRef.current.userData.voxelMap as Map<number, [number, number, number]>;
            const pos = voxelMap.get(index);
            if (pos) {
              performVoxelAction(pos[0], pos[1], pos[2], intersection.face?.normal);
            }
          }
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keyStateRef.current[e.key.toLowerCase()] = true;

      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        gridRef.current.clear();
        redrawVoxels(scene);
        onVoxelUpdate?.(gridRef.current.getAllVoxels());
      } else if (e.key >= '1' && e.key <= '5') {
        const colorIndex = parseInt(e.key) - 1;
        if (colorIndex < COLOR_NAMES.length) {
          setSelectedColor(COLOR_NAMES[colorIndex]);
          setEraseMode(false);
        }
      } else if (e.key.toLowerCase() === 'e') {
        setEraseMode((prev) => !prev);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keyStateRef.current[e.key.toLowerCase()] = false;
    };

    const performVoxelAction = (x: number, y: number, z: number, normal?: THREE.Vector3) => {
      const action: Action = { type: 'place', x, y, z, color: selectedColor };

      if (eraseMode) {
        const existing = gridRef.current.getVoxel(x, y, z);
        if (existing) {
          action.type = 'remove';
          action.previousColor = existing.color;
          gridRef.current.removeVoxel(x, y, z);
        }
      } else {
        if (normal) {
          const newX = x + Math.round(normal.x);
          const newY = y + Math.round(normal.y);
          const newZ = z + Math.round(normal.z);
          action.x = newX;
          action.y = newY;
          action.z = newZ;
        }
        gridRef.current.setVoxel(action.x, action.y, action.z, selectedColor);
      }

      undoManagerRef.current.push(action);
      setUndoCount(undoManagerRef.current.getStats().undoCount);
      setRedoCount(undoManagerRef.current.getStats().redoCount);
      redrawVoxels(scene);
      onVoxelUpdate?.(gridRef.current.getAllVoxels());
    };

    const handleUndo = () => {
      const action = undoManagerRef.current.undo();
      if (action) {
        if (action.type === 'place') {
          gridRef.current.removeVoxel(action.x, action.y, action.z);
        } else if (action.type === 'remove') {
          gridRef.current.setVoxel(action.x, action.y, action.z, action.previousColor || 'red');
        }
        redrawVoxels(scene);
        setUndoCount(undoManagerRef.current.getStats().undoCount);
        setRedoCount(undoManagerRef.current.getStats().redoCount);
        onVoxelUpdate?.(gridRef.current.getAllVoxels());
      }
    };

    const handleRedo = () => {
      const action = undoManagerRef.current.redo();
      if (action) {
        if (action.type === 'place') {
          gridRef.current.setVoxel(action.x, action.y, action.z, action.color || 'red');
        } else if (action.type === 'remove') {
          gridRef.current.removeVoxel(action.x, action.y, action.z);
        }
        redrawVoxels(scene);
        setUndoCount(undoManagerRef.current.getStats().undoCount);
        setRedoCount(undoManagerRef.current.getStats().redoCount);
        onVoxelUpdate?.(gridRef.current.getAllVoxels());
      }
    };

    const animate = () => {
      requestAnimationFrame(animate);

      const camera = cameraRef.current!;
      const speed = 0.5;
      const moveDir = new THREE.Vector3();
      moveDir.z += keyStateRef.current['w'] || keyStateRef.current['arrowup'] ? speed : 0;
      moveDir.z -= keyStateRef.current['s'] || keyStateRef.current['arrowdown'] ? speed : 0;
      moveDir.x -= keyStateRef.current['a'] || keyStateRef.current['arrowleft'] ? speed : 0;
      moveDir.x += keyStateRef.current['d'] || keyStateRef.current['arrowright'] ? speed : 0;

      if (moveDir.length() > 0) {
        moveDir.normalize().multiplyScalar(speed);
        camera.position.add(moveDir);
        camera.lookAt(centerX, 4, centerZ);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('dragover', onDragOver);
    renderer.domElement.addEventListener('drop', onDrop);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('dragover', onDragOver);
      renderer.domElement.removeEventListener('drop', onDrop);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [gridSize, selectedColor, eraseMode, onVoxelUpdate, selectedTool]);

  const redrawVoxels = (scene: THREE.Scene) => {
    // Remove old instanced mesh
    if (instancedMeshRef.current) {
      scene.remove(instancedMeshRef.current);
      instancedMeshRef.current.geometry.dispose();
      (instancedMeshRef.current.material as THREE.Material).dispose();
      instancedMeshRef.current = null;
    }

    const voxels = gridRef.current.getAllVoxels();
    if (voxels.length === 0) return;

    // Create instanced mesh
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial();
    const instancedMesh = new THREE.InstancedMesh(geometry, material, voxels.length);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    const voxelMap = new Map<number, [number, number, number]>();
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    voxels.forEach((voxel, index) => {
      matrix.setPosition(voxel.x, voxel.y, voxel.z);
      instancedMesh.setMatrixAt(index, matrix);
      color.setHex(COLORS[voxel.color] || 0xffffff);
      instancedMesh.setColorAt(index, color);
      voxelMap.set(index, [voxel.x, voxel.y, voxel.z]);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    instancedMesh.userData.voxelMap = voxelMap;
    instancedMeshRef.current = instancedMesh;
    scene.add(instancedMesh);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', padding: '12px' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center',
        background: '#f5f5f5',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
      }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#666' }}>Colors:</label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {COLOR_NAMES.map((color, idx) => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor(color);
                setEraseMode(false);
              }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                border: selectedColor === color && !eraseMode ? '2px solid #000' : '1px solid #ccc',
                background: `#${COLORS[color].toString(16).padStart(6, '0')}`,
                cursor: 'pointer',
                fontSize: '10px',
                color: '#fff',
                fontWeight: '600',
              }}
              title={`${color} (${idx + 1})`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => setEraseMode(!eraseMode)}
          style={{
            padding: '4px 10px',
            background: eraseMode ? '#ff6b6b' : '#fff',
            color: eraseMode ? '#fff' : '#000',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '12px',
          }}
          title="E key"
        >
          {eraseMode ? '✓ Erase' : 'Erase (E)'}
        </button>

        <button
          onClick={() => {
            gridRef.current.clear();
            undoManagerRef.current.clear();
            redrawVoxels(sceneRef.current!);
            setUndoCount(0);
            setRedoCount(0);
            onVoxelUpdate?.(gridRef.current.getAllVoxels());
          }}
          style={{
            padding: '4px 10px',
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
          title="Ctrl+C"
        >
          Clear
        </button>

        <button
          onClick={() => {
            const action = undoManagerRef.current.undo();
            if (action) {
              if (action.type === 'place') {
                gridRef.current.removeVoxel(action.x, action.y, action.z);
              } else if (action.type === 'remove') {
                gridRef.current.setVoxel(action.x, action.y, action.z, action.previousColor || 'red');
              }
              redrawVoxels(sceneRef.current!);
              setUndoCount(undoManagerRef.current.getStats().undoCount);
              setRedoCount(undoManagerRef.current.getStats().redoCount);
              onVoxelUpdate?.(gridRef.current.getAllVoxels());
            }
          }}
          disabled={undoCount === 0}
          style={{
            padding: '4px 10px',
            background: undoCount === 0 ? '#e0e0e0' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: undoCount === 0 ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: undoCount === 0 ? 0.5 : 1,
          }}
          title="Ctrl+Z"
        >
          ↶ Undo ({undoCount})
        </button>

        <button
          onClick={() => {
            const action = undoManagerRef.current.redo();
            if (action) {
              if (action.type === 'place') {
                gridRef.current.setVoxel(action.x, action.y, action.z, action.color || 'red');
              } else if (action.type === 'remove') {
                gridRef.current.removeVoxel(action.x, action.y, action.z);
              }
              redrawVoxels(sceneRef.current!);
              setUndoCount(undoManagerRef.current.getStats().undoCount);
              setRedoCount(undoManagerRef.current.getStats().redoCount);
              onVoxelUpdate?.(gridRef.current.getAllVoxels());
            }
          }}
          disabled={redoCount === 0}
          style={{
            padding: '4px 10px',
            background: redoCount === 0 ? '#e0e0e0' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: redoCount === 0 ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: redoCount === 0 ? 0.5 : 1,
          }}
          title="Ctrl+Y"
        >
          ↷ Redo ({redoCount})
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '11px', color: '#666' }}>
          <div>Voxels: <strong>{gridRef.current.getStats().voxelCount}</strong></div>
          <div>Grid: <strong>{gridSize}×{gridSize}</strong></div>
          <div>Fill: <strong>{gridRef.current.getStats().fillPercentage.toFixed(1)}%</strong></div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid #ddd',
          position: 'relative',
        }}
      />

      {/* Help text */}
      <div style={{
        fontSize: '11px',
        color: '#999',
        padding: '4px 8px',
        background: '#fafafa',
        borderRadius: '4px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '12px',
      }}>
        <div><strong>Place:</strong> Click voxel | <strong>Erase:</strong> E key | <strong>Colors:</strong> 1-5 keys</div>
        <div><strong>Camera:</strong> Right-drag or WASD | <strong>Undo:</strong> Ctrl+Z | <strong>Redo:</strong> Ctrl+Y</div>
        <div><strong>Clear All:</strong> Ctrl+C</div>
      </div>
    </div>
  );
}
