'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Globe, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-4 border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  WEBSITES
                </p>
                <p className="text-3xl font-bold text-card-foreground">0</p>
              </div>
              <Globe className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  UPTIME
                </p>
                <p className="text-3xl font-bold text-secondary-foreground">100%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  AVG RESPONSE
                </p>
                <p className="text-3xl font-bold text-card-foreground">0ms</p>
              </div>
              <Clock className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  INCIDENTS
                </p>
                <p className="text-3xl font-bold text-card-foreground">0</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Websites Section */}
      <Card className="border-4 border-border bg-card">
        <CardHeader className="border-b-4 border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
              YOUR WEBSITES
            </CardTitle>
            <Button className="border-4 border-border bg-primary text-primary-foreground hover:bg-primary/80 font-bold">
              <Plus className="h-4 w-4 mr-2" />
              ADD WEBSITE
            </Button>
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
            <Button 
              size="lg"
              className="border-4 border-border bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold px-8"
            >
              ADD YOUR FIRST WEBSITE
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
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
    </div>
  );
}
