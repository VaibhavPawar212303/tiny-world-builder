'use client';

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

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
      <SignedOut>
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
            <Link href="/sign-in" style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'white',
              color: '#667eea',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'transform 0.2s',
            }}>
              Sign In
            </Link>
            <Link href="/sign-up" style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              border: '2px solid white',
              transition: 'transform 0.2s',
            }}>
              Create Account
            </Link>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
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

          <Link href="/builder" style={{
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
          </Link>
        </div>
      </SignedIn>
    </main>
  );
}
