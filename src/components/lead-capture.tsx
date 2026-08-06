import { useState } from "react";
import { z } from "zod";
import { CalendarCheck, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitLead } from "@/lib/leads";
import type { ReportMatch } from "@/lib/lead-report";
import { track } from "@/lib/analytics";

const leadSchema = z.object({
  name: z.string().trim().max(100, { message: "Name must be under 100 characters" }).optional(),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be under 255 characters" }),
});


export function LeadCapture({
  matches,
  answers,
  regionPreference,
}: {
  matches: ReportMatch[];
  answers?: Record<string, string | string[]>;
  regionPreference?: string;
}) {
  const topDestinationId = matches[0]?.id;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [bookingOpen, setBookingOpen] = useState(false);


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = leadSchema.safeParse({ name, email });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setError(fieldErrors.email?.[0] ?? fieldErrors.name?.[0]);
      return;
    }
    setError(undefined);
    setStatus("saving");
    track("lead_submitted", { topDestinationId, newsletterOptIn: optIn });
    try {
      const result = await submitLead({
        name: parsed.data.name || undefined,
        email: parsed.data.email,
        matches,
        newsletterOptIn: optIn,
        ...(answers ? { answers } : {}),
        ...(regionPreference ? { regionPreference } : {}),
      });
      setStatus("done");
      if (result.reportStatus === "sent") {
        track("report_emailed", { topDestinationId });
        toast.success("Sent — check your inbox");
      } else {
        toast.success("Saved", {
          description: "We'll email your research plan as soon as sending is live.",
        });
      }
    } catch (err) {
      setStatus("idle");
      toast.error("Something went wrong", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }


  return (
    <>
      <Card className="border-primary/25 bg-accent/40 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="display text-xl">Take your research plan with you</CardTitle>
          <CardDescription>
            Get your full results — destination scores, budget breakdowns, visa complexity notes
            and your personalised list of questions to ask before committing — as a PDF in your
            inbox. One email, no spam, unsubscribe anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "done" ? (
            <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-background p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
              <div>
                <p className="font-medium">Sent — check your inbox</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your results stay right here on this page too. If it hasn't arrived in a few
                  minutes, check your spam folder.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="grid gap-4">
              <div className="grid gap-1.5 sm:max-w-md">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={email}
                  maxLength={255}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? "lead-email-error" : undefined}
                />
                {error && (
                  <p id="lead-email-error" role="alert" className="text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="lead-optin"
                  checked={optIn}
                  onCheckedChange={(v) => setOptIn(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="lead-optin" className="text-sm font-normal text-muted-foreground">
                  Also send me occasional destination deep-dives (monthly at most)
                </Label>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={status === "saving"} className="sm:w-auto">
                  <Mail aria-hidden="true" />
                  {status === "saving" ? "Sending…" : "Email my research plan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    track("consultation_clicked", { topDestinationId });
                    setBookingOpen(true);
                  }}
                >
                  <CalendarCheck aria-hidden="true" />
                  Book a planning call
                </Button>
              </div>
            </form>
          )}
          {status === "done" && (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                track("consultation_clicked", { topDestinationId });
                setBookingOpen(true);
              }}
            >
              <CalendarCheck aria-hidden="true" />
              Book a planning call
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="display">Book a planning call</DialogTitle>
            <DialogDescription>
              Scheduling isn't connected yet in this MVP. In the live version this opens a calendar
              where you pick a 30-minute slot with a relocation planner.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-dashed border-border bg-secondary/50 p-6 text-center text-sm text-muted-foreground">
            Calendar placeholder — booking integration goes here.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
