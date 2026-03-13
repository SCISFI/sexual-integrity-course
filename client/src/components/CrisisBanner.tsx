import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CrisisResources } from "@/components/CrisisResources";

interface CrisisBannerProps {
  onDismiss: () => void;
}

export function CrisisBanner({ onDismiss }: CrisisBannerProps) {
  const [showCrisisResources, setShowCrisisResources] = useState(false);

  return (
    <>
      <div className="flex items-start gap-3 rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 mt-2">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-red-800 dark:text-red-300">
          If you're struggling right now, you don't have to handle it alone.
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => setShowCrisisResources(true)}
          >
            View Crisis Resources
          </Button>
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <CrisisResources
        open={showCrisisResources}
        onOpenChange={setShowCrisisResources}
      />
    </>
  );
}