'use client';

import { Globe, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

import type { DashboardStats } from '@/types/website';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardStatsProps {
  stats: DashboardStats;
  isLoading?: boolean;
  error?: string | null;
}

export function DashboardStatsComponent({
  stats,
  isLoading,
  error,
}: DashboardStatsProps) {
  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return 'text-secondary-foreground';
    if (uptime >= 95) return 'text-accent-foreground';
    return 'text-destructive';
  };

  const formatResponseTime = (time: number) => {
    if (time === 0) return '0ms';
    return `${Math.round(time)}ms`;
  };

  const getDisplayValue = (value: string) => {
    if (error) return 'Error';
    if (isLoading) return '...';
    return value;
  };

  const statsConfig = [
    {
      label: 'WEBSITES',
      value: getDisplayValue(stats.totalWebsites.toString()),
      icon: Globe,
      iconColor: 'text-primary',
      valueColor: error ? 'text-destructive' : 'text-card-foreground',
    },
    {
      label: 'UPTIME',
      value: getDisplayValue(`${stats.uptime.toFixed(1)}%`),
      icon: TrendingUp,
      iconColor: 'text-secondary',
      valueColor: error ? 'text-destructive' : getUptimeColor(stats.uptime),
    },
    {
      label: 'AVG RESPONSE',
      value: getDisplayValue(formatResponseTime(stats.avgResponseTime)),
      icon: Clock,
      iconColor: 'text-accent',
      valueColor: error ? 'text-destructive' : 'text-card-foreground',
    },
    {
      label: 'INCIDENTS',
      value: getDisplayValue(stats.incidents.toString()),
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      valueColor: error
        ? 'text-destructive'
        : stats.incidents > 0
          ? 'text-destructive'
          : 'text-card-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat) => (
        <Card key={stat.label} className="border-4 border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </p>
                <p
                  className={`text-3xl font-bold font-sans ${stat.valueColor} ${isLoading ? 'animate-pulse' : ''}`}
                >
                  {stat.value}
                </p>
                {error && (
                  <p className="text-xs text-destructive mt-1">
                    Data unavailable
                  </p>
                )}
              </div>
              <stat.icon className={`h-8 w-8 ${stat.iconColor}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
