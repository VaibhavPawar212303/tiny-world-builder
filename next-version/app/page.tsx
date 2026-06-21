'use client';

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <SignedOut>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Tiny World Builder</h1>
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#666' }}>Create beautiful 3D voxel worlds in your browser</p>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <Link href="/sign-in" style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#0066cc',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              Sign In
            </Link>
            <Link href="/sign-up" style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#f0f0f0',
              color: '#333',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500',
              border: '1px solid #ddd'
            }}>
              Create Account
            </Link>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <UserButton />
        </div>

        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Welcome to Tiny World Builder</h1>
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#666' }}>Start creating your own unique voxel worlds</p>

          <Link href="/builder" style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: '#0066cc',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: '500'
          }}>
            Open Builder
          </Link>
        </div>
      </SignedIn>
    </main>
  );
}
