import { Brain, Zap } from "lucide-react";

export function BrainDiagram() {
  return (
    <div className="rounded-lg border p-6 bg-muted/30">
      <p className="text-sm font-medium text-center mb-6">The Brain in CSBD: Brake vs. Gas Pedal</p>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col items-center p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mb-3">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h4 className="font-semibold text-primary text-center">Prefrontal Cortex</h4>
          <p className="text-xs text-center text-muted-foreground mt-1 italic">"The Brake"</p>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Front of brain. Controls impulses, evaluates consequences, makes decisions.
          </p>
          <div className="mt-3 px-3 py-2 bg-primary/10 rounded text-xs text-center">
            <span className="font-medium">In CSBD:</span> Weakened, gets bypassed when triggered
          </div>
        </div>
        
        <div className="flex flex-col items-center p-4 rounded-lg bg-red-500/5 border border-red-500/20">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center mb-3">
            <Zap className="w-8 h-8 text-red-500" />
          </div>
          <h4 className="font-semibold text-red-600 dark:text-red-400 text-center">Limbic System</h4>
          <p className="text-xs text-center text-muted-foreground mt-1 italic">"The Gas Pedal"</p>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Deep brain center. Handles reward, motivation, and emotional responses.
          </p>
          <div className="mt-3 px-3 py-2 bg-red-500/10 rounded text-xs text-center">
            <span className="font-medium">In CSBD:</span> Hypersensitive, floods with "GO" signals
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 rounded-lg bg-background border text-center">
        <p className="text-sm font-medium">The Result</p>
        <p className="text-xs text-muted-foreground mt-1">
          When triggered, your gas pedal is flooring it while your brake is weak. 
          This is why willpower alone doesn't work.
        </p>
      </div>
    </div>
  );
}
