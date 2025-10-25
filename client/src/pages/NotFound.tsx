import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTransition } from "@/lib/animations";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <PageTransition className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <Card animated className="w-full max-w-lg mx-4 backdrop-blur-sm">
        <CardContent className="py-10 text-center space-y-6">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
            <AlertCircle className="size-10" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold">404</h1>
            <h2 className="text-xl font-semibold text-muted-foreground">
              Page Not Found
            </h2>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Sorry, the page you are looking for doesn't exist. It may have been
            moved or deleted.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button onClick={handleGoHome} className="px-6">
              <Home className="size-4 mr-2" aria-hidden="true" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
