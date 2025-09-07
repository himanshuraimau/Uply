'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { DashboardStatsComponent } from '@/components/dashboard/dashboard-stats';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { WebsiteList } from '@/components/websites/website-list';
import { WebsitesProvider } from '@/contexts/websites-context';

export default function DashboardPage() {
  const { dashboardData, isLoading } = useDashboard();

  const defaultStats = {
    totalWebsites: 0,
    uptime: 100,
    avgResponseTime: 0,
    incidents: 0,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="border-4 border-border bg-card p-6">
        <h1 className="text-4xl font-bold text-card-foreground mb-2 font-sans tracking-tight">
          DASHBOARD
        </h1>
        <p className="text-muted-foreground text-lg font-sans">
          Monitor your websites and track their uptime performance.
        </p>
      </div>

      {/* Quick Stats */}
      <DashboardStatsComponent 
        stats={dashboardData?.stats || defaultStats} 
        isLoading={isLoading}
      />

      {/* Websites Section */}
      <WebsitesProvider>
        <WebsiteList />
      </WebsitesProvider>

      {/* Recent Activity */}
      <RecentActivity 
        activities={dashboardData?.recentActivity || []} 
        isLoading={isLoading}
      />
    </div>
  );
}
