'use client';

import { UserButton, SignInButton, SignUpButton, Show } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/worlds');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Show when="signed-out">
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          maxWidth: '600px',
          color: 'white',
        }}>
          <h1 style={{
            fontSize: '56px',
            marginBottom: '16px',
            fontWeight: '700',
          }}>
            Tiny World Builder
          </h1>
          <p style={{
            fontSize: '20px',
            marginBottom: '40px',
            color: 'rgba(255, 255, 255, 0.9)',
          }}>
            Create beautiful 3D voxel worlds in your browser
          </p>

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <SignInButton mode="modal">
              <button style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'white',
                color: '#667eea',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: 'none',
                cursor: 'pointer',
              }}>
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                border: '2px solid white',
                cursor: 'pointer',
              }}>
                Create Account
              </button>
            </SignUpButton>
          </div>
        </div>
      </Show>
    </main>
  );
}
