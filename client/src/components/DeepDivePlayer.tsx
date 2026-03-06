import { Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DeepDivePlayerProps {
  title: string;
  src: string;
  description?: string;
}

export function DeepDivePlayer({ title, src, description }: DeepDivePlayerProps) {
  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3">
            <Headphones className="h-6 w-6 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs font-semibold tracking-widest uppercase hover:bg-cyan-500/20">
                The Deep Dive
              </Badge>
            </div>
            <h3 className="text-white font-semibold text-base leading-snug mb-1">{title}</h3>
            {description && (
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">{description}</p>
            )}
            <audio
              controls
              src={src}
              className="w-full mt-3"
              style={{ accentColor: "#22d3ee" }}
              data-testid="audio-deep-dive"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
