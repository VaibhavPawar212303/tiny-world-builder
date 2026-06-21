import { SignedIn, SignedOut } from '@clerk/react';
import { RedirectToSignIn } from '@clerk/nextjs';

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
