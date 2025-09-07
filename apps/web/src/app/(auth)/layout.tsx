import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b-4 border-border bg-background px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary border-4 border-border"></div>
            <h1 className="text-2xl font-bold text-foreground font-sans tracking-tight">UPLY</h1>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      {/* Auth Content */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
