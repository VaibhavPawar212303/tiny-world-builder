'use client';

import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { Canvas } from './components/canvas';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Voxel } from './lib/voxel-grid';

export default function BuilderPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const worldId = searchParams.get('id');
  const [initialVoxels, setInitialVoxels] = useState<Voxel[]>([]);
  const [worldTitle, setWorldTitle] = useState('Untitled World');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!worldId || !isLoaded) return;

    // Load world data
    const loadWorld = async () => {
      try {
        const res = await fetch(`/api/worlds/${worldId}`);
        if (res.ok) {
          const data = await res.json();
          setWorldTitle(data.title);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            ← Back to Worlds
          </a>
          <span style={{ fontSize: '13px', color: '#666' }}>
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </span>
          <UserButton />
        </div>
      </header>

      <main style={{ flex: 1, background: '#1a1a1a', overflow: 'hidden' }}>
        <Canvas initialVoxels={initialVoxels} onVoxelUpdate={handleVoxelUpdate} />
      </main>
    </div>
  );
}
