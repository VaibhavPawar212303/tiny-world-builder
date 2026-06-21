'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Canvas } from '@/app/builder/components/canvas';
import type { Voxel } from '@/app/builder/lib/voxel-grid';

interface SharedWorld {
  id: string;
  title: string;
  state: Voxel[];
}

export default function SharePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [world, setWorld] = useState<SharedWorld | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;

    const loadSharedWorld = async () => {
      try {
        const res = await fetch(`/api/worlds/share/${shareId}`);
        if (!res.ok) {
          setError('World not found or is not shared');
          return;
        }
        const data = await res.json();
        setWorld({
          id: data.id,
          title: data.title,
          state: data.state || [],
        });
      } catch (err) {
        setError('Failed to load shared world');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSharedWorld();
  }, [shareId]);

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
      }}>
        Loading shared world...
      </div>
    );
  }

  if (error || !world) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>
            🌍 {error ? 'World Not Found' : 'Shared World'}
          </h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            {error || 'This world is not available.'}
          </p>
          <a href="/" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#4ecdc4',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '600',
          }}>
            ← Back Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '16px',
        background: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            🌍 {world.title}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
            Shared World (Read-only)
          </p>
        </div>
        <a href="/" style={{
          padding: '8px 16px',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          textDecoration: 'none',
          color: '#333',
          fontWeight: '500',
        }}>
          ← Home
        </a>
      </header>

      <main style={{ flex: 1, background: '#1a1a1a', overflow: 'hidden' }}>
        <Canvas initialVoxels={world.state} />
      </main>
    </div>
  );
}
