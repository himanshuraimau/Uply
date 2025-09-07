'use client';

import { Clock, Globe, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import type { ActivityItem } from '@/types/website';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RecentActivityProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return status === 'DOWN' ? AlertTriangle : CheckCircle;
      case 'WEBSITE_ADDED':
        return Plus;
      case 'WEBSITE_REMOVED':
        return Trash2;
      default:
        return Globe;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return status === 'DOWN' ? 'text-destructive' : 'text-secondary';
      case 'WEBSITE_ADDED':
        return 'text-primary';
      case 'WEBSITE_REMOVED':
        return 'text-muted-foreground';
      default:
        return 'text-card-foreground';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    return (
      <Badge 
        className={`text-xs font-bold border-2 border-border ${
          status === 'UP' 
            ? 'bg-secondary text-secondary-foreground' 
            : 'bg-destructive text-destructive-foreground'
        }`}
      >
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-4 border-border bg-card">
        <CardHeader className="border-b-4 border-border">
          <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
            RECENT ACTIVITY
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted border-4 border-border mx-auto flex items-center justify-center animate-pulse">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-sans">Loading activity...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="border-4 border-border bg-card">
        <CardHeader className="border-b-4 border-border">
          <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
            RECENT ACTIVITY
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted border-4 border-border mx-auto flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground mb-2 font-sans tracking-tight">
                NO ACTIVITY
              </h3>
              <p className="text-muted-foreground font-sans">
                Once you add websites, you'll see their monitoring activity here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border">
        <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
          RECENT ACTIVITY
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type, activity.status);
            const iconColor = getActivityColor(activity.type, activity.status);
            
            return (
              <div key={activity.id} className="flex items-start space-x-4 p-4 border-2 border-border bg-background">
                <div className={`mt-1 ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-semibold text-card-foreground font-sans truncate">
                      {activity.websiteUrl.replace(/^https?:\/\//, '')}
                    </p>
                    {getStatusBadge(activity.status)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground font-sans">
                    {activity.message}
                  </p>
                  
                  <p className="text-xs text-muted-foreground font-sans mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}