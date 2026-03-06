import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DeepDivePlayerProps {
  title: string;
  src: string;
  description?: string;
}

export function DeepDivePlayer({ title, src, description }: DeepDivePlayerProps) {
  const isVideo = src.endsWith(".mp4") || src.endsWith(".webm") || src.endsWith(".mov");

  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-2">
            <Play className="h-4 w-4 text-cyan-400" />
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs font-semibold tracking-widest uppercase hover:bg-cyan-500/20">
            The Deep Dive
          </Badge>
        </div>
        <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
        {description && (
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">{description}</p>
        )}
        {isVideo ? (
          <video
            controls
            src={src}
            className="w-full rounded-lg mt-2"
            style={{ accentColor: "#22d3ee" }}
            data-testid="video-deep-dive"
          >
            Your browser does not support the video element.
          </video>
        ) : (
          <audio
            controls
            src={src}
            className="w-full mt-3"
            style={{ accentColor: "#22d3ee" }}
            data-testid="audio-deep-dive"
          >
            Your browser does not support the audio element.
          </audio>
        )}
      </CardContent>
    </Card>
  );
}
