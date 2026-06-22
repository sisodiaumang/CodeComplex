'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect instantly to the competitive dashboard division hub
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#14110F] flex items-center justify-center text-[#A8978A] font-mono text-xs">
      INITIALIZING DEVARENA ENGINE...
    </div>
  );
}