import { Link } from "react-router-dom";
import { Home, Search, FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";

const NotFound = () => {
  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">

          {/* Visual Element */}
          <div className="relative mx-auto h-32 w-32 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
            <div className="absolute inset-4 bg-primary/20 rounded-full" />
            <FileQuestion className="h-16 w-16 text-primary relative z-10" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-display font-bold tracking-tight text-foreground">
              Page not found
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 transition-transform active:scale-95">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-full border-border/60 hover:bg-muted transition-transform active:scale-95">
              <Link to="/browse">
                <Search className="mr-2 h-4 w-4" />
                Browse Notes
              </Link>
            </Button>
          </div>

          <div className="pt-8">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
