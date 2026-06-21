'use client';

import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

export default function BuilderPage() {
  const { user, isLoaded } = useUser();

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
        padding: '16px',
        background: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            Tiny World Builder
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </span>
          <UserButton />
        </div>
      </header>

      <main style={{
        flex: 1,
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>World Builder</h2>
          <p style={{ color: '#999', marginBottom: '20px' }}>
            Coming soon... Get ready to build amazing voxel worlds!
          </p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Ready to create your first world!
          </p>
        </div>
      </main>
    </div>
  );
}
