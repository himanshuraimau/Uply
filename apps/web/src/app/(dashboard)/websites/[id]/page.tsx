'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api';
import type { WebsiteWithStatus } from '@/types/website';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusIndicator } from '@/components/websites/status-indicator';
import { Loading } from '@/components/ui/loading';
import toast from 'react-hot-toast';

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [website, setWebsite] = useState<WebsiteWithStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const websiteId = params.id as string;

  useEffect(() => {
    const fetchWebsiteDetails = async () => {
      if (!token || !websiteId) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // For now, we'll fetch all websites and find the specific one
        // In a real app, you'd have a dedicated endpoint for single website details
        const response = await apiClient.getWebsites(token);
        const foundWebsite = response.websites.find((w: WebsiteWithStatus) => w.id === websiteId);
        
        if (!foundWebsite) {
          setError('Website not found');
          return;
        }
        
        setWebsite(foundWebsite);
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch website details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebsiteDetails();
  }, [token, websiteId]);

  const handleDelete = async () => {
    if (!website || !token) return;

    try {
      await apiClient.deleteWebsite(website.id, token);
      toast.success(`Website ${website.url} removed successfully!`);
      router.push('/websites');
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete website';
      toast.error(errorMessage);
    }
  };

  const handleVisitWebsite = () => {
    if (website) {
      window.open(website.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="border-4 border-border bg-card p-6">
          <Loading size="lg" text="Loading website details..." />
        </div>
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="space-y-8">
        <div className="border-4 border-border bg-card p-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-4 border-border hover:bg-muted font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              BACK
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-destructive mb-2 font-sans tracking-tight">
                ERROR
              </h1>
              <p className="text-muted-foreground font-sans">
                {error || 'Website not found'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-4 border-border hover:bg-muted font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              BACK
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-card-foreground mb-2 font-sans tracking-tight">
                {website.url.replace(/^https?:\/\//, '')}
              </h1>
              <p className="text-muted-foreground font-mono">
                {website.url}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleVisitWebsite}
              className="border-4 border-border hover:bg-muted font-semibold"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              VISIT
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="border-4 border-border hover:bg-destructive hover:text-destructive-foreground font-semibold"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              DELETE
            </Button>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <Card className="border-4 border-border bg-card">
        <CardHeader className="border-b-4 border-border">
          <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
            CURRENT STATUS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <StatusIndicator
              status={website.currentStatus?.status || 'UNKNOWN'}
              responseTime={website.currentStatus?.responseTime}
              className="text-lg"
            />
            
            {website.currentStatus?.checkedAt && (
              <p className="text-sm text-muted-foreground font-sans">
                Last checked {formatDistanceToNow(new Date(website.currentStatus.checkedAt), { addSuffix: true })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-4 border-border bg-card">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
              UPTIME
            </p>
            <p className="text-4xl font-bold text-secondary-foreground font-sans">
              {website.uptime ? `${website.uptime.toFixed(1)}%` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-4 border-border bg-card">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
              AVG RESPONSE
            </p>
            <p className="text-4xl font-bold text-card-foreground font-sans">
              {website.avgResponseTime ? `${website.avgResponseTime}ms` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-4 border-border bg-card">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
              STATUS CODE
            </p>
            <p className="text-4xl font-bold text-card-foreground font-sans">
              {website.currentStatus?.statusCode || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Website Info */}
      <Card className="border-4 border-border bg-card">
        <CardHeader className="border-b-4 border-border">
          <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
            WEBSITE INFORMATION
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
                URL
              </p>
              <p className="text-card-foreground font-mono break-all">
                {website.url}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
                STATUS
              </p>
              <p className="text-card-foreground font-sans">
                {website.isActive ? 'Active Monitoring' : 'Monitoring Paused'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
                ADDED
              </p>
              <p className="text-card-foreground font-sans">
                {formatDistanceToNow(new Date(website.createdAt), { addSuffix: true })}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
                REGION
              </p>
              <p className="text-card-foreground font-sans">
                {website.currentStatus?.region || 'Global'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}