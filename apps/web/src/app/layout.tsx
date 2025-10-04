import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "react-hot-toast";

// Futuristic Typography Setup - Design System
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const ibmPlexMonoMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap", 
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "UPLY - WEBSITE MONITORING",
  description:
    "Monitor your websites' uptime and performance across multiple regions. Get instant alerts when your sites go down.",
  keywords: [
    "website monitoring",
    "uptime monitoring", 
    "site monitoring",
    "performance tracking",
    "downtime alerts",
  ],
  authors: [{ name: "UPLY Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${ibmPlexMono.variable} ${ibmPlexMonoMono.variable} font-sans antialiased h-full bg-background text-foreground tracking-wide`}
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                    border: '2px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                  },
                  success: {
                    style: {
                      border: '2px solid hsl(var(--primary))',
                      boxShadow: '0 0 12px hsl(var(--primary) / 0.3)',
                    },
                  },
                  error: {
                    style: {
                      border: '2px solid hsl(var(--destructive))',
                      boxShadow: '0 0 12px hsl(var(--destructive) / 0.3)',
                    },
                  },
                }}
              />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
