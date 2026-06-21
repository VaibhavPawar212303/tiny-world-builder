'use client';

import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { Canvas } from './components/canvas';
import { BuildingPalette } from './components/building-palette';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Voxel } from './lib/voxel-grid';
import type { GridSize } from './lib/voxel-grid';
import { v4 as uuidv4 } from 'uuid';

export default function BuilderPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const worldId = searchParams.get('id');
  const [initialVoxels, setInitialVoxels] = useState<Voxel[]>([]);
  const [worldTitle, setWorldTitle] = useState('Untitled World');
  const [gridSize, setGridSize] = useState<GridSize>(16);
  const [shareId, setShareId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentVoxels, setCurrentVoxels] = useState<Voxel[]>([]);

  useEffect(() => {
    if (!worldId || !isLoaded) return;

    // Load world data
    const loadWorld = async () => {
      try {
        const res = await fetch(`/api/worlds/${worldId}`);
        if (res.ok) {
          const data = await res.json();
          setWorldTitle(data.title);
          setShareId(data.shareId);
          if (data.state && Array.isArray(data.state)) {
            setInitialVoxels(data.state);
          }
        }
      } catch (error) {
        console.error('Failed to load world:', error);
      }
    };

    loadWorld();
  }, [worldId, isLoaded]);

  const handleVoxelUpdate = async (voxels: Voxel[]) => {
    setCurrentVoxels(voxels);
    if (!worldId || isSaving) return;

    setIsSaving(true);
    try {
      await fetch(`/api/worlds/${worldId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: voxels }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save world:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlaceBuilding = (buildingVoxels: Voxel[]) => {
    // Merge building voxels with current voxels and update
    const mergedVoxels = [...currentVoxels, ...buildingVoxels];
    handleVoxelUpdate(mergedVoxels);
  };

  const handleShare = async () => {
    if (!worldId) return;

    try {
      const newShareId = shareId || uuidv4();
      const shareUrl = `${window.location.origin}/share/${newShareId}`;

      if (!shareId) {
        await fetch(`/api/worlds/${worldId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shareId: newShareId }),
        });
        setShareId(newShareId);
      }

      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
      setShowShareModal(false);
    } catch (error) {
      console.error('Failed to generate share link:', error);
    }
  };

  if (!isLoaded) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
      }}>
        <div>Loading builder...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '12px 16px',
        background: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {worldTitle}
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#999' }}>
            {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Unsaved'}
            {isSaving && ' (saving...)'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowShareModal(true)}
            style={{
              padding: '6px 12px',
              background: '#4ecdc4',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            🔗 Share
          </button>
          <a
            href="/worlds"
            style={{
              padding: '6px 12px',
              background: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              textDecoration: 'none',
              color: '#333',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            ← Worlds
          </a>
          <span style={{ fontSize: '13px', color: '#666' }}>
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </span>
          <UserButton />
        </div>
      </header>

      <main style={{ flex: 1, background: '#1a1a1a', overflow: 'hidden', position: 'relative' }}>
        <Canvas initialVoxels={initialVoxels} onVoxelUpdate={handleVoxelUpdate} gridSize={gridSize} />
        <BuildingPalette onPlaceBuilding={handlePlaceBuilding} gridSize={gridSize} />
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
              🔗 Share Your World
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
              Generate a shareable link so others can view your creation.
            </p>
            <div style={{
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              wordBreak: 'break-all',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}>
              {shareId ? `${window.location.origin}/share/${shareId}` : 'Click "Generate Link" to create a shareable URL'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleShare}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#4ecdc4',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                {shareId ? '📋 Copy Link' : '🔗 Generate Link'}
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
