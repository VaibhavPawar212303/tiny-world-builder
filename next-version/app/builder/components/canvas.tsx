'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VoxelGrid, type Voxel } from '../lib/voxel-grid';

const COLORS: Record<string, number> = {
  red: 0xff6b6b,
  blue: 0x4ecdc4,
  green: 0x95e1d3,
  yellow: 0xffe66d,
  purple: 0xc7b3e5,
};

const COLOR_NAMES = Object.keys(COLORS);

interface CanvasProps {
  onVoxelUpdate?: (voxels: Voxel[]) => void;
  initialVoxels?: Voxel[];
}

export function Canvas({ onVoxelUpdate, initialVoxels }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridRef = useRef<VoxelGrid>(new VoxelGrid(16, 16));
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const [selectedColor, setSelectedColor] = useState<string>('red');
  const [eraseMode, setEraseMode] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

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
    camera.position.set(20, 15, 20);
    camera.lookAt(8, 4, 8);
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
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(32, 32);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(32, 16, 0x444444, 0x222222);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Load initial voxels
    if (initialVoxels) {
      gridRef.current.fromJSON(initialVoxels);
      redrawVoxels(scene);
    }

    // Orbit camera controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) return; // Right click for orbit
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging && e.buttons === 2) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        const camera = cameraRef.current!;
        const spherical = new THREE.Spherical().setFromVector3(
          camera.position.clone().sub(new THREE.Vector3(8, 4, 8))
        );

        spherical.theta -= deltaX * 0.01;
        spherical.phi -= deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        const offset = new THREE.Vector3().setFromSpherical(spherical);
        camera.position.copy(new THREE.Vector3(8, 4, 8).add(offset));
        camera.lookAt(8, 4, 8);
      }
      previousMousePosition = { x: e.clientX, y: e.clientY };

      // Raycasting for hover preview
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onClick = (e: MouseEvent) => {
      if (isDragging) return;

      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!);

      const meshArray = Array.from(meshesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(meshArray);

      if (intersects.length > 0) {
        const intersection = intersects[0];
        const mesh = intersection.object;
        const position = (mesh.userData as any).position as [number, number, number];

        if (eraseMode) {
          gridRef.current.removeVoxel(position[0], position[1], position[2]);
        } else {
          // Find adjacent empty space to place new voxel
          const face = intersection.face;
          if (face) {
            const normal = face.normal.clone();
            const newPos = [position[0] + normal.x, position[1] + normal.y, position[2] + normal.z];
            gridRef.current.setVoxel(newPos[0], newPos[1], newPos[2], selectedColor);
          }
        }

        redrawVoxels(scene);
        onVoxelUpdate?.(gridRef.current.getAllVoxels());
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('click', onClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [selectedColor, eraseMode, onVoxelUpdate]);

  const redrawVoxels = (scene: THREE.Scene) => {
    // Remove old voxels
    meshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    meshesRef.current.clear();

    // Add new voxels
    const voxels = gridRef.current.getAllVoxels();
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    voxels.forEach((voxel) => {
      const material = new THREE.MeshLambertMaterial({
        color: COLORS[voxel.color] || 0xffffff,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(voxel.x, voxel.y, voxel.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { position: [voxel.x, voxel.y, voxel.z] };
      scene.add(mesh);

      const key = `${voxel.x},${voxel.y},${voxel.z}`;
      meshesRef.current.set(key, mesh);
    });
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
      }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#666' }}>Color:</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {COLOR_NAMES.map((color) => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor(color);
                setEraseMode(false);
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                border: selectedColor === color && !eraseMode ? '3px solid #000' : '1px solid #ccc',
                background: `#${COLORS[color].toString(16).padStart(6, '0')}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title={color}
            />
          ))}
        </div>

        <button
          onClick={() => setEraseMode(!eraseMode)}
          style={{
            padding: '6px 12px',
            background: eraseMode ? '#ff6b6b' : '#fff',
            color: eraseMode ? '#fff' : '#000',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          {eraseMode ? '✓ Erase' : 'Erase'}
        </button>

        <button
          onClick={() => {
            gridRef.current.clear();
            redrawVoxels(sceneRef.current!);
            onVoxelUpdate?.(gridRef.current.getAllVoxels());
          }}
          style={{
            padding: '6px 12px',
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>

        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
          Voxels: {gridRef.current.getStats().voxelCount}
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
        }}
      />
    </div>
  );
}
