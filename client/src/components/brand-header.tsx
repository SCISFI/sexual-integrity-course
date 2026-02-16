import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function BrandHeader() {
  const [, setLocation] = useLocation();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Left: Brand */}
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">The Integrity Protocol</span>
          <span className="text-xs text-muted-foreground">
            16-Week Structured Recovery Program
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
          >
            Dashboard
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/login")}
          >
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
