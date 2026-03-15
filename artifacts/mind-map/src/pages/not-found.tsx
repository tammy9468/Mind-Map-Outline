import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center max-w-md p-8 glass-panel rounded-3xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">404 - Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The node or page you are looking for doesn't exist or has been removed from the mind map.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
        >
          Return to Workspace
        </Link>
      </div>
    </div>
  );
}
