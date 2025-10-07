import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation - Futuristic Design */}
      <nav className="border-b-2 border-border bg-background px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary border-2 border-border animate-pulse-slow"></div>
            <h1 className="text-2xl font-bold text-foreground font-sans tracking-wide uppercase">
              UPLY
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="outline" className="hover-glow" asChild>
              <Link href="/login">LOGIN</Link>
            </Button>
            <Button className="hover-glow" asChild>
              <Link href="/signup">GET STARTED</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Website Monitoring */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Headlines & CTA */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground font-sans uppercase tracking-wide leading-tight">
                MONITOR YOUR
                <br />
                <span className="text-primary animate-glow">WEBSITES</span>
                <br />
                BRUTALLY FAST
              </h1>
              <p className="text-xl text-muted-foreground font-sans leading-relaxed">
                Get instant alerts when your websites go down. Monitor uptime,
                performance, and response times across multiple regions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="hover-glow text-lg" asChild>
                <Link href="/signup">START MONITORING FREE</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="hover-glow text-lg"
                asChild
              >
                <Link href="/login">VIEW DEMO</Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground font-sans tracking-wide">
                  99.9%
                </div>
                <div className="text-sm text-muted-foreground uppercase font-medium font-sans tracking-wide">
                  UPTIME
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground font-sans tracking-wide">
                  &lt; 1MIN
                </div>
                <div className="text-sm text-muted-foreground uppercase font-medium font-sans tracking-wide">
                  DETECTION
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground font-sans tracking-wide">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground uppercase font-medium font-sans tracking-wide">
                  MONITORING
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="tech-card p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-2 border-border pb-4">
                  <h3 className="text-xl font-bold text-card-foreground font-sans tracking-wide uppercase">
                    DASHBOARD
                  </h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-destructive border border-border rounded-sm"></div>
                    <div className="w-3 h-3 bg-primary border border-border rounded-sm"></div>
                    <div className="w-3 h-3 bg-accent border border-border rounded-sm"></div>
                  </div>
                </div>

                {/* Website Status Cards */}
                <div className="space-y-3">
                  <div className="border-2 border-border rounded-md p-4 bg-background hover-glow flex justify-between items-center">
                    <div>
                      <div className="font-bold text-card-foreground font-sans uppercase text-sm">
                        mywebsite.com
                      </div>
                      <div className="text-xs text-muted-foreground font-sans">
                        Response: 245ms
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary border border-border rounded-full animate-pulse-slow"></div>
                      <span className="font-bold text-xs text-primary font-sans uppercase">
                        UP
                      </span>
                    </div>
                  </div>

                  <div className="border-2 border-border rounded-md p-4 bg-background hover-glow flex justify-between items-center">
                    <div>
                      <div className="font-bold text-card-foreground font-sans uppercase text-sm">
                        api.example.com
                      </div>
                      <div className="text-xs text-muted-foreground font-sans">
                        Response: 128ms
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary border border-border rounded-full animate-pulse-slow"></div>
                      <span className="font-bold text-xs text-primary font-sans uppercase">
                        UP
                      </span>
                    </div>
                  </div>

                  <div className="border-2 border-border rounded-md p-4 bg-background hover-glow flex justify-between items-center">
                    <div>
                      <div className="font-bold text-card-foreground font-sans uppercase text-sm">
                        shop.store.com
                      </div>
                      <div className="text-xs text-muted-foreground font-sans">
                        Last seen: 2min ago
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-destructive border border-border rounded-full"></div>
                      <span className="font-bold text-xs text-destructive font-sans uppercase">
                        DOWN
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section - Website Monitoring */}
      <section className="px-6 py-16 bg-card">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-card-foreground font-sans tracking-wide uppercase">
            MONITORING FEATURES
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="tech-card p-8">
              <div className="w-12 h-12 bg-primary border-2 border-border mb-6 animate-pulse-slow"></div>
              <h3 className="text-xl font-bold mb-4 text-card-foreground font-sans tracking-wide uppercase">
                GLOBAL MONITORING
              </h3>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Monitor from multiple regions worldwide. Get real-time insights
                into your website's performance globally.
              </p>
            </div>

            <div className="tech-card p-8">
              <div className="w-12 h-12 bg-accent border-2 border-border mb-6 animate-pulse-slow"></div>
              <h3 className="text-xl font-bold mb-4 text-card-foreground font-sans tracking-wide uppercase">
                INSTANT ALERTS
              </h3>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Get notified immediately when your website goes down. Multiple
                notification channels available.
              </p>
            </div>

            <div className="tech-card p-8">
              <div className="w-12 h-12 bg-chart-1 border-2 border-border mb-6 animate-pulse-slow"></div>
              <h3 className="text-xl font-bold mb-4 text-card-foreground font-sans tracking-wide uppercase">
                PERFORMANCE TRACKING
              </h3>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Track response times, uptime percentage, and get detailed
                performance analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Status Section - Website Monitoring Stats */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-foreground font-sans tracking-wide uppercase text-center">
            CURRENT STATUS
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="tech-card p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2 font-sans tracking-wide status-positive">
                99.9%
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase font-sans tracking-wide ticker">
                UPTIME
              </div>
            </div>

            <div className="tech-card p-6 text-center">
              <div className="text-3xl font-bold text-accent mb-2 font-sans tracking-wide">
                142ms
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase font-sans tracking-wide ticker">
                AVG RESPONSE
              </div>
            </div>

            <div className="tech-card p-6 text-center">
              <div className="text-3xl font-bold text-chart-1 mb-2 font-sans tracking-wide status-positive">
                12
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase font-sans tracking-wide ticker">
                REGIONS
              </div>
            </div>

            <div className="tech-card p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2 font-sans tracking-wide status-positive">
                0
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase font-sans tracking-wide ticker">
                INCIDENTS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4 font-sans tracking-wide uppercase">
            START MONITORING NOW
          </h2>
          <p className="text-xl text-primary-foreground mb-8 max-w-2xl mx-auto font-sans leading-relaxed">
            Join thousands of developers and businesses who trust UPLY to keep
            their websites running smoothly.
          </p>

          <Button
            size="lg"
            className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover-glow text-xl px-12 py-6"
            asChild
          >
            <Link href="/signup">GET STARTED FOR FREE</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t-2 border-border bg-background">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-primary border-2 border-border animate-pulse-slow"></div>
            <span className="font-bold text-foreground font-sans tracking-wide uppercase">
              UPLY
            </span>
          </div>
          <div className="text-sm text-muted-foreground font-sans uppercase tracking-wide">
            © 2025 UPLY. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
