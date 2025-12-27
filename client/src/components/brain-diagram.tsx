import brainImage from "@assets/stock_images/brain_anatomy_medica_d10c7d56.jpg";

export function BrainDiagram() {
  return (
    <div className="rounded-lg border p-6 bg-muted/30">
      <p className="text-sm font-medium text-center mb-4">The Brain in CSBD</p>
      
      <div className="relative w-full max-w-md mx-auto">
        <img 
          src={brainImage} 
          alt="Brain anatomy showing prefrontal cortex and limbic system" 
          className="w-full rounded-lg"
        />
        
        <div className="absolute top-[15%] left-[10%] bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-semibold shadow-md">
          PREFRONTAL CORTEX
          <div className="text-[10px] font-normal opacity-90">"The Brake"</div>
        </div>
        
        <div className="absolute top-[45%] left-[35%] bg-red-500/90 text-white px-2 py-1 rounded text-xs font-semibold shadow-md">
          LIMBIC SYSTEM
          <div className="text-[10px] font-normal opacity-90">"The Gas Pedal"</div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 rounded bg-primary flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Prefrontal Cortex</div>
            <div className="text-muted-foreground">Impulse control & consequence evaluation. Weakened in CSBD - gets bypassed when triggered.</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 rounded bg-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Limbic System</div>
            <div className="text-muted-foreground">Reward & motivation center. Hypersensitive in CSBD - floods system with "GO" signals.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
