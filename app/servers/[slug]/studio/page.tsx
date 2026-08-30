import React from 'react';
import { SentinelStudioDashboard } from '../../../../src/components/studio/SentinelStudioDashboard';

export interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export default async function SentinelStudioPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || 'vice-city-rp';
  const serverName = slug.replace(/-/g, ' ').toUpperCase();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-cyan-500 selection:text-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SentinelStudioDashboard
          serverSlug={slug}
          serverName={serverName}
          serverId={`srv_${slug}`}
        />
      </div>
    </main>
  );
}
