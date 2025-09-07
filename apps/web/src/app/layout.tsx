import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "react-hot-toast";

// Vercel-inspired Typography Setup
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Uply - Website Monitoring",
  description:
    "Monitor your websites' uptime and performance across multiple regions. Get instant alerts when your sites go down.",
  keywords: [
    "website monitoring",
    "uptime monitoring",
    "site monitoring",
    "performance tracking",
  ],
  authors: [{ name: "Uply Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased h-full bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
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
                  border: '4px solid hsl(var(--border))',
                  borderRadius: '0',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '600',
                },
                success: {
                  style: {
                    border: '4px solid hsl(var(--primary))',
                  },
                },
                error: {
                  style: {
                    border: '4px solid hsl(var(--destructive))',
                  },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
