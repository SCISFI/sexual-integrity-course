import { Brain, Footprints, Zap, ArrowDown } from "lucide-react";

export function AddictionCycleDiagram() {
  return (
    <div className="rounded-lg border p-6 bg-muted/30">
      <p className="text-sm font-medium text-center mb-6">The 4-Stage Addiction Cycle</p>
      
      <div className="relative w-full max-w-md mx-auto aspect-square">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" className="fill-primary/60" />
            </marker>
          </defs>
          
          <circle cx="150" cy="150" r="90" fill="none" className="stroke-primary/20" strokeWidth="2" strokeDasharray="8 4" />
          
          <path d="M 150 60 A 90 90 0 0 1 240 150" fill="none" className="stroke-primary/50" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <path d="M 240 150 A 90 90 0 0 1 150 240" fill="none" className="stroke-primary/50" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <path d="M 150 240 A 90 90 0 0 1 60 150" fill="none" className="stroke-primary/50" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <path d="M 60 150 A 90 90 0 0 1 150 60" fill="none" className="stroke-primary/50" strokeWidth="2" markerEnd="url(#arrowhead)" />
        </svg>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs font-medium mt-1 text-center">1. Preoccupation</span>
        </div>
        
        <div className="absolute top-1/2 right-0 translate-x-2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <Footprints className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs font-medium mt-1 text-center">2. Ritualization</span>
        </div>
        
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs font-medium mt-1 text-center">3. Acting Out</span>
        </div>
        
        <div className="absolute top-1/2 left-0 -translate-x-2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 flex items-center justify-center">
            <ArrowDown className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <span className="text-xs font-medium mt-1 text-center text-red-700 dark:text-red-400">4. Despair</span>
        </div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-[10px] text-muted-foreground leading-tight max-w-[100px]">
            The cycle repeats as despair triggers preoccupation
          </div>
        </div>
      </div>
    </div>
  );
}
