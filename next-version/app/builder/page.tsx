'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function BuilderPage() {
  const { user, isLoaded } = useUser();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      // Initialize the world builder when user is authenticated
      setIsReady(true);
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (!user) {
    return <div style={{ padding: '20px' }}>Please sign in to access the builder.</div>;
  }

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div style={{ padding: '10px', background: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '18px' }}>Tiny World Builder</h1>
          <div>
            <span style={{ marginRight: '10px' }}>Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress}</span>
          </div>
        </div>
      </div>

      <div style={{
        width: '100%',
        height: 'calc(100vh - 50px)',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        {isReady ? (
          <div>
            <p>World Builder Coming Soon...</p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              User ID: {user.id}
            </p>
          </div>
        ) : (
          <p>Initializing...</p>
        )}
      </div>
    </div>
  );
}
