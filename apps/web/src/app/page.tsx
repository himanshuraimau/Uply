import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <nav className="border-b-4 border-border bg-background px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary border-4 border-border"></div>
            <h1 className="text-2xl font-bold text-foreground font-sans tracking-tight">UPLY</h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="outline" className="border-4 border-border hover:bg-primary hover:text-primary-foreground font-semibold">
              LOGIN
            </Button>
            <Button className="border-4 border-border bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-semibold">
              GET STARTED
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold leading-none text-foreground font-sans tracking-tight">
                MONITOR YOUR
                <br />
                <span className="text-primary">WEBSITES</span>
                <br />
                BRUTALLY FAST
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg font-sans leading-relaxed">
                Get instant alerts when your websites go down. Monitor uptime, performance, and response times across multiple regions.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="border-4 border-border bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg font-semibold"
              >
                START MONITORING FREE
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-4 border-border hover:bg-muted hover:text-foreground px-8 py-4 text-lg font-semibold"
              >
                VIEW DEMO
              </Button>
            </div>

            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground font-sans tracking-tight">99.9%</div>
                <div className="text-sm text-muted-foreground uppercase font-medium font-sans tracking-wide">UPTIME</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground font-sans tracking-tight">&lt; 1min</div>
                <div className="text-sm text-muted-foreground uppercase font-medium font-sans tracking-wide">DETECTION</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground font-sans tracking-tight">24/7</div>
                <div className="text-sm text-muted-foreground uppercase font-medium font-sans tracking-wide">MONITORING</div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="border-4 border-border bg-card p-6 shadow-xl">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-4 border-border pb-4">
                  <h3 className="text-xl font-bold text-card-foreground font-sans tracking-tight">DASHBOARD</h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-destructive border border-border"></div>
                    <div className="w-3 h-3 bg-primary border border-border"></div>
                    <div className="w-3 h-3 bg-secondary border border-border"></div>
                  </div>
                </div>
                
                {/* Website Cards */}
                <div className="space-y-3">
                  <div className="border-2 border-border p-4 bg-card flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-card-foreground font-sans">mywebsite.com</div>
                      <div className="text-sm text-muted-foreground font-sans">Response: 245ms</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-secondary border border-border"></div>
                      <span className="font-semibold text-sm text-secondary-foreground font-sans">UP</span>
                    </div>
                  </div>
                  
                  <div className="border-2 border-border p-4 bg-card flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-card-foreground font-sans">api.example.com</div>
                      <div className="text-sm text-muted-foreground font-sans">Response: 128ms</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-secondary border border-border"></div>
                      <span className="font-semibold text-sm text-secondary-foreground font-sans">UP</span>
                    </div>
                  </div>

                  <div className="border-2 border-border p-4 bg-card flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-card-foreground font-sans">shop.store.com</div>
                      <div className="text-sm text-muted-foreground font-sans">Last seen: 2min ago</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-destructive border border-border"></div>
                      <span className="font-semibold text-sm text-card-foreground font-sans">DOWN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-muted">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground font-sans tracking-tight">
            MONITORING FEATURES
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-4 border-border bg-card p-6 shadow-xl">
              <div className="w-12 h-12 bg-primary border-2 border-border mb-4"></div>
              <h3 className="text-xl font-bold mb-2 text-card-foreground font-sans tracking-tight">GLOBAL MONITORING</h3>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Monitor from multiple regions worldwide. Get real-time insights into your website's performance globally.
              </p>
            </div>
            
            <div className="border-4 border-border bg-card p-6 shadow-xl">
              <div className="w-12 h-12 bg-secondary border-2 border-border mb-4"></div>
              <h3 className="text-xl font-bold mb-2 text-card-foreground font-sans tracking-tight">INSTANT ALERTS</h3>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Get notified immediately when your website goes down. Multiple notification channels available.
              </p>
            </div>
            
            <div className="border-4 border-border bg-card p-6 shadow-xl">
              <div className="w-12 h-12 bg-accent border-2 border-border mb-4"></div>
              <h3 className="text-xl font-bold mb-2 text-card-foreground font-sans tracking-tight">PERFORMANCE TRACKING</h3>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Track response times, uptime percentage, and get detailed performance analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-foreground font-sans tracking-tight">
            CURRENT STATUS
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="border-2 border-border p-6 bg-card">
              <div className="text-3xl font-bold text-secondary-foreground mb-2 font-sans tracking-tight">99.9%</div>
              <div className="text-sm font-medium text-muted-foreground uppercase font-sans tracking-wide">UPTIME</div>
            </div>
            
            <div className="border-2 border-border p-6 bg-card">
              <div className="text-3xl font-bold text-foreground mb-2 font-sans tracking-tight">142ms</div>
              <div className="text-sm font-medium text-muted-foreground uppercase font-sans tracking-wide">AVG RESPONSE</div>
            </div>
            
            <div className="border-2 border-border p-6 bg-card">
              <div className="text-3xl font-bold text-card-foreground mb-2 font-sans tracking-tight">12</div>
              <div className="text-sm font-medium text-muted-foreground uppercase font-sans tracking-wide">REGIONS</div>
            </div>
            
            <div className="border-2 border-border p-6 bg-card">
              <div className="text-3xl font-bold text-foreground mb-2 font-sans tracking-tight">0</div>
              <div className="text-sm font-medium text-muted-foreground uppercase font-sans tracking-wide">INCIDENTS</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4 font-sans tracking-tight">
            START MONITORING NOW
          </h2>
          <p className="text-xl text-primary-foreground mb-8 max-w-2xl mx-auto font-sans leading-relaxed">
            Join thousands of developers and businesses who trust Uply to keep their websites running smoothly.
          </p>
          
          <Button 
            size="lg"
            className="border-4 border-border bg-background text-foreground hover:bg-foreground hover:text-background px-12 py-6 text-xl font-semibold"
          >
            GET STARTED FOR FREE
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t-4 border-border bg-background">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary border-2 border-border"></div>
            <span className="font-bold text-foreground font-sans tracking-tight">UPLY</span>
          </div>
          <div className="text-sm text-muted-foreground font-sans">
            © 2025 UPLY. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
