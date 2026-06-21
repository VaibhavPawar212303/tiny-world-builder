'use client';

import { useState } from 'react';
import { BUILDING_PRESETS, type BuildingType, placeBuilding } from '../lib/building-presets';

interface BuildingPaletteProps {
  onPlaceBuilding?: (voxels: Array<{ x: number; y: number; z: number; color: string }>) => void;
  gridSize: number;
}

export function BuildingPalette({ onPlaceBuilding, gridSize }: BuildingPaletteProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType>('house');
  const [placementMode, setPlacementMode] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [offsetZ, setOffsetZ] = useState(0);

  const selectedPreset = BUILDING_PRESETS[selectedBuilding];

  const handlePlace = () => {
    const voxels = placeBuilding(selectedPreset, offsetX, offsetY, offsetZ);
    onPlaceBuilding?.(voxels);
    // Reset offsets
    setOffsetX(0);
    setOffsetY(0);
    setOffsetZ(0);
    setPlacementMode(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: '#fff',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxWidth: '320px',
        zIndex: 100,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
        🏗️ Buildings
      </h3>

      {!placementMode ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {Object.entries(BUILDING_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setSelectedBuilding(key as BuildingType)}
                style={{
                  padding: '8px 12px',
                  background: selectedBuilding === key ? '#4ecdc4' : '#f5f5f5',
                  color: selectedBuilding === key ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div
            style={{
              background: '#f9f9f9',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '12px',
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {selectedPreset.name}
            </p>
            <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>
              {selectedPreset.description}
            </p>
            <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '10px' }}>
              Size: {selectedPreset.width}×{selectedPreset.depth}×{selectedPreset.height}
            </p>
          </div>

          <button
            onClick={() => setPlacementMode(true)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#4ecdc4',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Place Building
          </button>
        </>
      ) : (
        <>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#666' }}>
            Set placement coordinates:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
              <span style={{ fontWeight: '600', marginBottom: '4px' }}>X</span>
              <input
                type="number"
                min="0"
                max={gridSize - selectedPreset.width}
                value={offsetX}
                onChange={(e) => setOffsetX(Math.max(0, Math.min(gridSize - selectedPreset.width, parseInt(e.target.value) || 0)))}
                style={{
                  padding: '6px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
              <span style={{ fontWeight: '600', marginBottom: '4px' }}>Y</span>
              <input
                type="number"
                min="0"
                max={Math.max(0, gridSize - selectedPreset.height)}
                value={offsetY}
                onChange={(e) => setOffsetY(Math.max(0, Math.min(gridSize - selectedPreset.height, parseInt(e.target.value) || 0)))}
                style={{
                  padding: '6px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
              <span style={{ fontWeight: '600', marginBottom: '4px' }}>Z</span>
              <input
                type="number"
                min="0"
                max={gridSize - selectedPreset.depth}
                value={offsetZ}
                onChange={(e) => setOffsetZ(Math.max(0, Math.min(gridSize - selectedPreset.depth, parseInt(e.target.value) || 0)))}
                style={{
                  padding: '6px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePlace}
              style={{
                flex: 1,
                padding: '10px',
                background: '#4ecdc4',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px',
              }}
            >
              ✓ Place
            </button>
            <button
              onClick={() => {
                setPlacementMode(false);
                setOffsetX(0);
                setOffsetY(0);
                setOffsetZ(0);
              }}
              style={{
                flex: 1,
                padding: '10px',
                background: '#f0f0f0',
                color: '#333',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px',
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
