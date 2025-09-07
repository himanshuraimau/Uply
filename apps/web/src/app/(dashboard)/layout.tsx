'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ProtectedRoute>
  );
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b-4 border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary border-4 border-border"></div>
              <h1 className="text-2xl font-bold text-card-foreground font-sans tracking-tight">UPLY</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 border-2 border-border px-3 py-2 bg-background">
                <User className="h-4 w-4" />
                <span className="font-bold text-sm uppercase">{user?.username}</span>
              </div>
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={logout}
                className="border-4 border-border hover:bg-destructive hover:text-destructive-foreground font-semibold"
              >
                <LogOut className="h-4 w-4 mr-2" />
                LOGOUT
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
