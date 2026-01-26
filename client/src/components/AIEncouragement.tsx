import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, Lightbulb } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface AIEncouragementProps {
  weekNumber: number;
}

export function AIEncouragement({ weekNumber }: AIEncouragementProps) {
  const [showTechnique, setShowTechnique] = useState(false);

  const { data: encouragementData, isLoading: loadingEncouragement, refetch: refetchEncouragement } = useQuery<{ encouragement: string; weekNumber: number }>({
    queryKey: ['ai-encouragement', weekNumber],
    queryFn: async () => {
      const res = await fetch(`/api/ai/encouragement?week=${weekNumber}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch encouragement");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: techniqueData, isLoading: loadingTechnique, refetch: refetchTechnique } = useQuery<{ reminder: string; weekNumber: number }>({
    queryKey: ['ai-technique', weekNumber],
    queryFn: async () => {
      const res = await fetch(`/api/ai/technique?week=${weekNumber}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch technique");
      return res.json();
    },
    enabled: showTechnique,
    staleTime: 1000 * 60 * 5,
  });

  const handleRefreshEncouragement = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ai-encouragement', weekNumber] });
    refetchEncouragement();
  };

  const handleRefreshTechnique = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ai-technique', weekNumber] });
    refetchTechnique();
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium text-primary">Encouragement</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshEncouragement}
                  disabled={loadingEncouragement}
                  className="h-8 w-8 p-0"
                  data-testid="button-refresh-encouragement"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingEncouragement ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {loadingEncouragement ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="text-encouragement">
                  {encouragementData?.encouragement || "You're doing great work. Keep going!"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!showTechnique ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTechnique(true)}
          className="w-full"
          data-testid="button-show-technique"
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          Get a Technique Reminder
        </Button>
      ) : (
        <Card className="border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700/40">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/40 p-2">
                <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400">Technique Reminder</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshTechnique}
                    disabled={loadingTechnique}
                    className="h-8 w-8 p-0"
                    data-testid="button-refresh-technique"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingTechnique ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {loadingTechnique ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-technique">
                    {techniqueData?.reminder || "Take a moment to practice mindfulness."}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
