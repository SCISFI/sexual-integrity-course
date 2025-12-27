export function BrainDiagram() {
  return (
    <div className="rounded-lg border p-6 bg-muted/30">
      <p className="text-sm font-medium text-center mb-4">The Brain in CSBD</p>
      
      <div className="relative w-full max-w-sm mx-auto">
        <svg viewBox="0 0 300 220" className="w-full">
          <path
            d="M 150 20 
               C 80 20, 30 70, 30 120 
               C 30 180, 80 200, 150 200 
               C 220 200, 270 180, 270 120 
               C 270 70, 220 20, 150 20"
            fill="none"
            className="stroke-muted-foreground/40"
            strokeWidth="2"
          />
          
          <path
            d="M 80 60 C 70 80, 50 100, 60 130"
            fill="none"
            className="stroke-muted-foreground/30"
            strokeWidth="1"
          />
          <path
            d="M 100 45 C 95 70, 75 95, 80 120"
            fill="none"
            className="stroke-muted-foreground/30"
            strokeWidth="1"
          />
          <path
            d="M 150 30 C 150 60, 140 90, 145 120"
            fill="none"
            className="stroke-muted-foreground/30"
            strokeWidth="1"
          />
          <path
            d="M 200 45 C 205 70, 225 95, 220 120"
            fill="none"
            className="stroke-muted-foreground/30"
            strokeWidth="1"
          />
          <path
            d="M 220 60 C 230 80, 250 100, 240 130"
            fill="none"
            className="stroke-muted-foreground/30"
            strokeWidth="1"
          />
          
          <ellipse
            cx="90"
            cy="70"
            rx="45"
            ry="35"
            className="fill-primary/20 stroke-primary"
            strokeWidth="2"
          />
          
          <ellipse
            cx="150"
            cy="140"
            rx="50"
            ry="40"
            className="fill-red-500/20 stroke-red-500"
            strokeWidth="2"
          />
          
          <text x="90" y="65" textAnchor="middle" className="fill-primary text-[10px] font-semibold">
            PREFRONTAL
          </text>
          <text x="90" y="78" textAnchor="middle" className="fill-primary text-[10px] font-semibold">
            CORTEX
          </text>
          
          <text x="150" y="135" textAnchor="middle" className="fill-red-600 dark:fill-red-400 text-[10px] font-semibold">
            LIMBIC
          </text>
          <text x="150" y="148" textAnchor="middle" className="fill-red-600 dark:fill-red-400 text-[10px] font-semibold">
            SYSTEM
          </text>
        </svg>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-primary">Prefrontal Cortex</div>
            <div className="text-muted-foreground">"The Brake" - Impulse control, consequences. Weakened in CSBD.</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500/20 border-2 border-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-600 dark:text-red-400">Limbic System</div>
            <div className="text-muted-foreground">"The Gas Pedal" - Reward, urges. Hypersensitive in CSBD.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
