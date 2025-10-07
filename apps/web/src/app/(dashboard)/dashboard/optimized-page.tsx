'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { DashboardStatsComponent } from '@/components/dashboard/dashboard-stats';
import { OptimizedRecentActivity } from '@/components/dashboard/optimized-recent-activity';
import { WebsiteList } from '@/components/websites/website-list';

export default function OptimizedDashboardPage() {
  const { dashboardData, isLoading, error } = useDashboard();

  // Use the optimized recent activity hook with initial data from dashboard
  const { activities } = useRecentActivity(dashboardData?.recentActivity || []);

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
        error={error}
      />

      {/* Websites Section */}
      <WebsiteList />

      {/* Optimized Recent Activity with real-time updates */}
      <OptimizedRecentActivity
        activities={activities}
        isLoading={isLoading && activities.length === 0}
        error={error}
      />
    </div>
  );
}
