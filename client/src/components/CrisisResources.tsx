import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Phone, MessageCircle, ExternalLink } from "lucide-react";

export function CrisisResources() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          data-testid="button-crisis-resources"
        >
          <AlertTriangle className="h-4 w-4" />
          Crisis Resources
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Crisis Resources
          </DialogTitle>
          <DialogDescription>
            If you're in crisis or having thoughts of self-harm, please reach out immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-3">
            <h3 className="font-semibold text-destructive">Immediate Help</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-destructive" />
                <div>
                  <div className="font-medium">988 Suicide & Crisis Lifeline</div>
                  <div className="text-muted-foreground">Call or text: 988</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-destructive" />
                <div>
                  <div className="font-medium">Crisis Text Line</div>
                  <div className="text-muted-foreground">Text HOME to 741741</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-destructive" />
                <div>
                  <div className="font-medium">Emergency Services</div>
                  <div className="text-muted-foreground">Call 911</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold">Recovery Support</h3>
            
            <div className="space-y-2 text-sm">
              <a
                href="https://saa-recovery.org/find-a-meeting/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
                data-testid="link-saa-meetings"
              >
                <ExternalLink className="h-3 w-3" />
                Sex Addicts Anonymous (SAA) Meetings
              </a>
              
              <a
                href="https://www.celebraterecovery.com/crfinder"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
                data-testid="link-celebrate-recovery"
              >
                <ExternalLink className="h-3 w-3" />
                Celebrate Recovery (Faith-Based)
              </a>
              
              <a
                href="https://sanon.org/find-a-meeting/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
                data-testid="link-sanon"
              >
                <ExternalLink className="h-3 w-3" />
                S-Anon (For Partners/Family)
              </a>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold">Important Reminders</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Urges are temporary - they will pass</li>
              <li>• A lapse does not equal failure</li>
              <li>• Reaching out is strength, not weakness</li>
              <li>• Your therapist is here to support you</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)} data-testid="button-close-crisis">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
