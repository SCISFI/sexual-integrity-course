import { useState, forwardRef, InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  showCapsLockWarning?: boolean;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showCapsLockWarning = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.getModifierState) {
        setCapsLockOn(e.getModifierState("CapsLock"));
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.getModifierState) {
        setCapsLockOn(e.getModifierState("CapsLock"));
      }
    };

    return (
      <div className="space-y-1">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            ref={ref}
            onKeyUp={handleKeyUp}
            onKeyDown={handleKeyDown}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            data-testid="button-toggle-password"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {showCapsLockWarning && capsLockOn && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500" data-testid="text-caps-lock-warning">
            <AlertTriangle className="h-3 w-3" />
            <span>Caps Lock is on</span>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
