import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileNav } from './MobileNav';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function Layout({ children, hideFooter = false }: LayoutProps) {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex min-h-[100dvh] flex-col pb-16 lg:pb-0"> {/* Safe area for MobileNav */}
      <OfflineBanner isOnline={isOnline} />
      <ErrorBoundary>
        <Header />
      </ErrorBoundary>
      <main className="flex-1">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      {!hideFooter && (
        <ErrorBoundary>
          <Footer />
        </ErrorBoundary>
      )}
      <ErrorBoundary>
        <MobileNav />
      </ErrorBoundary>
    </div>
  );
}
