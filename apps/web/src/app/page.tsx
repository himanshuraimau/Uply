import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <nav className="border-b-4 border-black bg-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-yellow-500 border-4 border-black"></div>
            <h1 className="text-2xl font-black text-black">UPLY</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="border-4 border-black hover:bg-yellow-500 hover:text-black">
              LOGIN
            </Button>
            <Button className="border-4 border-black bg-black text-white hover:bg-yellow-500 hover:text-black">
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
              <h1 className="text-6xl font-black leading-none text-black">
                MONITOR YOUR
                <br />
                <span className="text-yellow-500">WEBSITES</span>
                <br />
                BRUTALLY FAST
              </h1>
              <p className="text-xl text-gray-600 max-w-lg">
                Get instant alerts when your websites go down. Monitor uptime, performance, and response times across multiple regions.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="border-4 border-black bg-black text-white hover:bg-yellow-500 hover:text-black px-8 py-4 text-lg font-black"
              >
                START MONITORING FREE
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-4 border-black hover:bg-gray-100 hover:text-black px-8 py-4 text-lg font-black"
              >
                VIEW DEMO
              </Button>
            </div>

            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-black text-black">99.9%</div>
                <div className="text-sm text-gray-600 uppercase font-bold">UPTIME</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-black">&lt; 1min</div>
                <div className="text-sm text-gray-600 uppercase font-bold">DETECTION</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-black">24/7</div>
                <div className="text-sm text-gray-600 uppercase font-bold">MONITORING</div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000]">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-4 border-black pb-4">
                  <h3 className="text-xl font-black text-black">DASHBOARD</h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 border border-black"></div>
                    <div className="w-3 h-3 bg-yellow-500 border border-black"></div>
                    <div className="w-3 h-3 bg-green-500 border border-black"></div>
                  </div>
                </div>
                
                {/* Website Cards */}
                <div className="space-y-3">
                  <div className="border-2 border-black p-4 bg-white flex justify-between items-center">
                    <div>
                      <div className="font-bold text-black">mywebsite.com</div>
                      <div className="text-sm text-gray-600">Response: 245ms</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 border border-black"></div>
                      <span className="font-black text-sm text-green-600">UP</span>
                    </div>
                  </div>
                  
                  <div className="border-2 border-black p-4 bg-white flex justify-between items-center">
                    <div>
                      <div className="font-bold text-black">api.example.com</div>
                      <div className="text-sm text-gray-600">Response: 128ms</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 border border-black"></div>
                      <span className="font-black text-sm text-green-600">UP</span>
                    </div>
                  </div>
                  
                  <div className="border-2 border-black p-4 bg-white flex justify-between items-center">
                    <div>
                      <div className="font-bold text-black">shop.store.com</div>
                      <div className="text-sm text-red-600">Last seen: 2min ago</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 border border-black"></div>
                      <span className="font-black text-sm text-red-600">DOWN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-12 text-black">
            MONITORING FEATURES
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000]">
              <div className="w-12 h-12 bg-yellow-500 border-2 border-black mb-4"></div>
              <h3 className="text-xl font-black mb-2 text-black">GLOBAL MONITORING</h3>
              <p className="text-gray-600">
                Monitor from multiple regions worldwide. Get real-time insights into your website's performance globally.
              </p>
            </div>
            
            <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000]">
              <div className="w-12 h-12 bg-green-500 border-2 border-black mb-4"></div>
              <h3 className="text-xl font-black mb-2 text-black">INSTANT ALERTS</h3>
              <p className="text-gray-600">
                Get notified immediately when your website goes down. Multiple notification channels available.
              </p>
            </div>
            
            <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000]">
              <div className="w-12 h-12 bg-red-500 border-2 border-black mb-4"></div>
              <h3 className="text-xl font-black mb-2 text-black">PERFORMANCE TRACKING</h3>
              <p className="text-gray-600">
                Track response times, uptime percentage, and get detailed performance analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-8 text-black">
            CURRENT STATUS
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="border-2 border-black p-6 bg-white">
              <div className="text-3xl font-black text-green-600 mb-2">99.9%</div>
              <div className="text-sm font-bold text-gray-600 uppercase">UPTIME</div>
            </div>
            
            <div className="border-2 border-black p-6 bg-white">
              <div className="text-3xl font-black text-yellow-600 mb-2">142ms</div>
              <div className="text-sm font-bold text-gray-600 uppercase">AVG RESPONSE</div>
            </div>
            
            <div className="border-2 border-black p-6 bg-white">
              <div className="text-3xl font-black text-black mb-2">12</div>
              <div className="text-sm font-bold text-gray-600 uppercase">REGIONS</div>
            </div>
            
            <div className="border-2 border-black p-6 bg-white">
              <div className="text-3xl font-black text-red-600 mb-2">0</div>
              <div className="text-sm font-bold text-gray-600 uppercase">INCIDENTS</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-yellow-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-black mb-4">
            START MONITORING NOW
          </h2>
          <p className="text-xl text-black mb-8 max-w-2xl mx-auto">
            Join thousands of developers and businesses who trust Uply to keep their websites running smoothly.
          </p>
          
          <Button 
            size="lg"
            className="border-4 border-black bg-white text-black hover:bg-black hover:text-white px-12 py-6 text-xl font-black"
          >
            GET STARTED FOR FREE
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t-4 border-black bg-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-yellow-500 border-2 border-black"></div>
            <span className="font-black text-black">UPLY</span>
          </div>
          <div className="text-sm text-gray-600">
            © 2024 UPLY. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
