'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api';
import type { WebsiteWithStatus } from '@/types/website';
import { useWebsites } from '@/contexts/websites-context';
import { WebsitesProvider } from '@/contexts/websites-context';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusIndicator } from '@/components/websites/status-indicator';
import { Loading } from '@/components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

function WebsiteDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { websites, deleteWebsite } = useWebsites();
  const [website, setWebsite] = useState<WebsiteWithStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const websiteId = params.id as string;
  
  // Get return URL from search params
  const returnUrl = searchParams.get('return') || '/websites';

  // Watch for website being deleted from shared state
  useEffect(() => {
    if (!isLoading && website && !websites.find(w => w.id === websiteId)) {
      // Website was deleted from shared state, redirect
      console.log('Website deleted from shared state, redirecting to:', returnUrl);
      router.push(returnUrl);
    }
  }, [websites, websiteId, website, isLoading, returnUrl, router]);

  useEffect(() => {
    // Try to find website in shared state first
    const foundWebsite = websites.find(w => w.id === websiteId);
    
    if (foundWebsite) {
      setWebsite(foundWebsite);
      setIsLoading(false);
      setError(null);
      return;
    }

    // If not in shared state and we haven't loaded yet, fetch from API
    if (isLoading) {
      const fetchWebsiteDetails = async () => {
        if (!token || !websiteId) return;

        try {
          setError(null);
          
          const response = await apiClient.getWebsites(token);
          const apiWebsite = response.websites.find((w: WebsiteWithStatus) => w.id === websiteId);
          
          if (!apiWebsite) {
            setError('Website not found');
            return;
          }
          
          setWebsite(apiWebsite);
        } catch (error) {
          const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch website details';
          setError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };

      fetchWebsiteDetails();
    }
  }, [websites, websiteId, token, isLoading]);

  const handleDelete = async () => {
    if (!website) return;

    console.log('Starting delete process...');

    try {
      setIsDeleting(true);
      console.log('Calling deleteWebsite...');
      await deleteWebsite(website.id, website.url);
      console.log('Delete successful');
      
      // Close dialog - the useEffect will handle redirect when website disappears from state
      setShowDeleteDialog(false);
      
    } catch (error) {
      // Error is handled by the hook
      console.error('Delete website error:', error);
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
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
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-4 border-border hover:bg-destructive hover:text-destructive-foreground font-semibold"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  DELETE
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-border bg-card max-w-md">
                <DialogHeader className="border-b-4 border-border pb-4">
                  <DialogTitle className="text-xl font-bold text-card-foreground font-sans tracking-tight">
                    DELETE WEBSITE
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    This action cannot be undone. All monitoring data for this website will be permanently removed.
                  </DialogDescription>
                </DialogHeader>

                <div className="pt-4 space-y-4">
                  <p className="text-card-foreground font-sans">
                    Are you sure you want to delete monitoring for{' '}
                    <span className="font-bold">{website.url}</span>?
                  </p>

                  <div className="flex space-x-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                      className="flex-1 border-4 border-border hover:bg-muted font-semibold"
                      disabled={isDeleting}
                    >
                      CANCEL
                    </Button>
                    <Button
                      onClick={handleDelete}
                      className="flex-1 border-4 border-border bg-destructive text-destructive-foreground hover:bg-destructive/80 font-bold"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'DELETING...' : 'DELETE'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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

export default function WebsiteDetailPage() {
  return (
    <WebsitesProvider>
      <WebsiteDetailPageContent />
    </WebsitesProvider>
  );
}