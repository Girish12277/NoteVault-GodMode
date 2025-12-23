import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AnimatedRoutes } from "./components/layout/AnimatedRoutes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from 'react';


// Create a client with optimized defaults for better caching and performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time (was cacheTime in v4)
      refetchOnWindowFocus: false, // Don't refetch on every window focus
      refetchOnReconnect: true, // Refetch on reconnect (offline recovery)
      retry: 1, // Only retry failed requests once
    },
  },
});

const App = () => {
  // Initialize Web Vitals monitoring in production
  useEffect(() => {
    if (import.meta.env.PROD) {
      import('@/lib/webVitals').then(({ initWebVitals }) => {
        initWebVitals();
      });
    }
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                {/* <Toaster /> Removed in favor of Sonner */}
                <Sonner />
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <ErrorBoundary>
                    <AnimatedRoutes />
                  </ErrorBoundary>
                </BrowserRouter>
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
