import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SignedOut>
        <div style={{ textAlign: 'center' }}>
          <h1>Tiny World Builder</h1>
          <p>Sign in to start building</p>
          <RedirectToSignIn />
        </div>
      </SignedOut>

      <SignedIn>
        <div style={{ textAlign: 'center' }}>
          <h1>Welcome to Tiny World Builder</h1>
          <Link href="/builder" style={{ display: 'inline-block', padding: '12px 24px', background: '#0066cc', color: 'white', borderRadius: '8px', textDecoration: 'none', marginTop: '20px' }}>
            Open Builder
          </Link>
        </div>
      </SignedIn>
    </main>
  );
}
