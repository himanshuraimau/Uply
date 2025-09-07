'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import type { WebsiteWithStatus } from '@/types/website';
import { useWebsites } from '@/contexts/websites-context';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StatusIndicator } from './status-indicator';

interface WebsiteCardProps {
  website: WebsiteWithStatus;
}

export function WebsiteCard({ website }: WebsiteCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteWebsite } = useWebsites();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteWebsite(website.id, website.url);
      setShowDeleteDialog(false);
    } catch (error) {
      // Error is handled by the hook
      console.error('Delete website error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVisitWebsite = () => {
    window.open(website.url, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = () => {
    // Get current path to know where to return after delete
    const currentPath = window.location.pathname;
    const returnUrl = currentPath.includes('/dashboard') ? '/dashboard' : '/websites';
    router.push(`/websites/${website.id}?return=${encodeURIComponent(returnUrl)}`);
  };

  const getUptimeColor = (uptime?: number) => {
    if (!uptime) return 'text-muted-foreground';
    if (uptime >= 99) return 'text-secondary-foreground';
    if (uptime >= 95) return 'text-accent-foreground';
    return 'text-destructive';
  };

  return (
    <Card className="border-4 border-border bg-card hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6" onClick={handleCardClick}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-card-foreground truncate font-sans tracking-tight">
              {website.url.replace(/^https?:\/\//, '')}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">
              {website.url}
            </p>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleVisitWebsite();
              }}
              className="h-8 w-8 p-0 hover:bg-muted"
              aria-label="Visit website"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Delete website"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-border bg-card max-w-md">
                <DialogHeader className="border-b-4 border-border pb-4">
                  <DialogTitle className="text-xl font-bold text-card-foreground font-sans tracking-tight">
                    DELETE WEBSITE
                  </DialogTitle>
                </DialogHeader>

                <div className="pt-4 space-y-4">
                  <p className="text-card-foreground font-sans">
                    Are you sure you want to delete monitoring for{' '}
                    <span className="font-bold">{website.url}</span>?
                  </p>
                  <p className="text-sm text-muted-foreground font-sans">
                    This action cannot be undone. All monitoring data for this website will be permanently removed.
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

        <div className="space-y-3">
          <StatusIndicator
            status={website.currentStatus?.status || 'UNKNOWN'}
            responseTime={website.currentStatus?.responseTime}
          />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                UPTIME
              </p>
              <p className={`text-lg font-bold font-sans ${getUptimeColor(website.uptime)}`}>
                {website.uptime ? `${website.uptime.toFixed(1)}%` : 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                AVG RESPONSE
              </p>
              <p className="text-lg font-bold text-card-foreground font-sans">
                {website.avgResponseTime ? `${website.avgResponseTime}ms` : 'N/A'}
              </p>
            </div>
          </div>

          {website.currentStatus?.checkedAt && (
            <p className="text-xs text-muted-foreground font-sans">
              Last checked {formatDistanceToNow(new Date(website.currentStatus.checkedAt), { addSuffix: true })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}