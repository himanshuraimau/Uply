'use client';

import { WebsiteList } from '@/components/websites/website-list';
import { WebsitesProvider } from '@/contexts/websites-context';

export default function WebsitesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-border bg-card p-6">
        <h1 className="text-4xl font-bold text-card-foreground mb-2 font-sans tracking-tight">
          WEBSITES
        </h1>
        <p className="text-muted-foreground text-lg font-sans">
          Manage and monitor all your websites in one place.
        </p>
      </div>

      {/* Websites List */}
      <WebsitesProvider>
        <WebsiteList />
      </WebsitesProvider>
    </div>
  );
}