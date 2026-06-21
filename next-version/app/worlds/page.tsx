'use client';

import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface World {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorldsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const loadWorlds = async () => {
      try {
        const res = await fetch('/api/worlds');
        if (res.ok) {
          const data = await res.json();
          setWorlds(data);
        }
      } catch (error) {
        console.error('Failed to load worlds:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorlds();
  }, [isLoaded]);

  const [gridSizeModal, setGridSizeModal] = useState(false);
  const [selectedGridSize, setSelectedGridSize] = useState<'16' | '32' | '64'>('16');

  const handleCreateWorld = async (gridSize?: '16' | '32' | '64') => {
    setCreating(true);
    try {
      const newWorld = {
        title: 'New World',
        description: `A fresh ${gridSize || selectedGridSize}×${gridSize || selectedGridSize} world waiting to be built`,
        state: {},
      };

      const res = await fetch('/api/worlds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorld),
      });

      if (res.ok) {
        const data = await res.json();
        setGridSizeModal(false);
        router.push(`/builder?id=${data.id}`);
      }
    } catch (error) {
      console.error('Failed to create world:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorld = async (worldId: string) => {
    if (!confirm('Are you sure you want to delete this world?')) return;

    try {
      await fetch(`/api/worlds/${worldId}`, { method: 'DELETE' });
      setWorlds(worlds.filter((w) => w.id !== worldId));
    } catch (error) {
      console.error('Failed to delete world:', error);
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
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        background: '#fff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>
            My Worlds
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Create and manage your voxel worlds
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
              {user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Create World Button */}
          <button
            onClick={() => setGridSizeModal(true)}
            disabled={creating}
            style={{
              padding: '12px 24px',
              background: '#4ecdc4',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.6 : 1,
              marginBottom: '30px',
            }}
          >
            {creating ? 'Creating...' : '+ New World'}
          </button>

          {/* Worlds Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', color: '#666' }}>
              Loading worlds...
            </div>
          ) : worlds.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999',
            }}>
              <p style={{ fontSize: '18px', marginBottom: '12px' }}>
                No worlds yet. Create your first one!
              </p>
              <p style={{ fontSize: '14px' }}>
                Click the "New World" button to get started.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {worlds.map((world) => (
                <div
                  key={world.id}
                  style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                    {world.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#666',
                    flex: 1,
                  }}>
                    {world.description || 'No description'}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: '#999',
                  }}>
                    Modified: {new Date(world.updatedAt).toLocaleDateString()}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                  }}>
                    <button
                      onClick={() => router.push(`/builder?id=${world.id}`)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#4ecdc4',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteWorld(world.id)}
                      style={{
                        padding: '8px 12px',
                        background: '#ff6b6b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Grid Size Modal */}
      {gridSizeModal && (
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
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
              Choose Grid Size
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666' }}>
              Select the size of your voxel world. Larger grids support more complex creations.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {(['16', '32', '64'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedGridSize(size)}
                  style={{
                    padding: '16px',
                    background: selectedGridSize === size ? '#4ecdc4' : '#f5f5f5',
                    color: selectedGridSize === size ? '#fff' : '#333',
                    border: selectedGridSize === size ? 'none' : '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px',
                  }}
                >
                  {size} × {size} ({parseInt(size) * parseInt(size) * parseInt(size)} voxels)
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleCreateWorld(selectedGridSize)}
                disabled={creating}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#4ecdc4',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: creating ? 0.6 : 1,
                }}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setGridSizeModal(false)}
                disabled={creating}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
