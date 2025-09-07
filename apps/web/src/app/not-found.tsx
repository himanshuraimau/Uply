'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="border-4 border-border bg-card max-w-md w-full">
        <CardHeader className="border-b-4 border-border text-center">
          <div className="w-16 h-16 bg-muted border-4 border-border mx-auto flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-muted-foreground font-sans">404</span>
          </div>
          <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
            PAGE NOT FOUND
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-muted-foreground font-sans">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              variant="outline"
              className="border-4 border-border hover:bg-muted font-semibold"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                HOME
              </Link>
            </Button>
            <Button
              onClick={() => window.history.back()}
              className="border-4 border-border bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              GO BACK
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}