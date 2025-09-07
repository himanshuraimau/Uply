'use client';

import { Globe } from 'lucide-react';

import type { WebsiteWithStatus } from '@/types/website';
import { useWebsites } from '@/hooks/useWebsites';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WebsiteCard } from './website-card';
import { AddWebsiteModal } from './add-website-modal';

export function WebsiteList() {
  const { websites, isLoading, error } = useWebsites();

  if (isLoading) {
    return (
      <Card className="border-4 border-border bg-card">
        <CardHeader className="border-b-4 border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
              YOUR WEBSITES
            </CardTitle>
            <AddWebsiteModal />
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted border-4 border-border mx-auto flex items-center justify-center animate-pulse">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-sans">Loading websites...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-4 border-border bg-card">
        <CardHeader className="border-b-4 border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
              YOUR WEBSITES
            </CardTitle>
            <AddWebsiteModal />
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-destructive border-4 border-border mx-auto flex items-center justify-center">
              <Globe className="h-8 w-8 text-destructive-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground mb-2 font-sans tracking-tight">
                ERROR LOADING WEBSITES
              </h3>
              <p className="text-muted-foreground font-sans">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (websites.length === 0) {
    return (
      <Card className="border-4 border-border bg-card">
        <CardHeader className="border-b-4 border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
              YOUR WEBSITES
            </CardTitle>
            <AddWebsiteModal />
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted border-4 border-border mx-auto flex items-center justify-center">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground mb-2 font-sans tracking-tight">
                NO WEBSITES YET
              </h3>
              <p className="text-muted-foreground font-sans">
                Add your first website to start monitoring its uptime and performance.
              </p>
            </div>
            <AddWebsiteModal 
              trigger={
                <Button 
                  size="lg"
                  className="border-4 border-border bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold px-8"
                >
                  ADD YOUR FIRST WEBSITE
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
            YOUR WEBSITES ({websites.length})
          </CardTitle>
          <AddWebsiteModal />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <WebsiteCard key={website.id} website={website} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}