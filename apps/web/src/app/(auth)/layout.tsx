import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b-2 border-border bg-background px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary border-2 border-border animate-pulse-slow"></div>
            <h1 className="text-2xl font-bold text-foreground font-sans tracking-wide uppercase">UPLY</h1>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Auth Content */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
