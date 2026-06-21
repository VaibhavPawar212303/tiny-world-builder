'use client';

import { UserButton, SignInButton, SignUpButton, Show } from '@clerk/nextjs';

export default function Home() {
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

      <Show when="signed-in">
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
        }}>
          <UserButton />
        </div>

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
            Welcome Back!
          </h1>
          <p style={{
            fontSize: '20px',
            marginBottom: '40px',
            color: 'rgba(255, 255, 255, 0.9)',
          }}>
            Start creating your own unique voxel worlds
          </p>

          <a href="/builder" style={{
            display: 'inline-block',
            padding: '16px 40px',
            background: 'white',
            color: '#667eea',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}>
            Open Builder
          </a>
        </div>
      </Show>
    </main>
  );
}
