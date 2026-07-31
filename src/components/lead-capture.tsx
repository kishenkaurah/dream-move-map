import { useState } from "react";
import { z } from "zod";
import { CalendarCheck, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitLead } from "@/lib/leads";
import { track } from "@/lib/analytics";

const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Please enter your name" })
    .max(100, { message: "Name must be under 100 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be under 255 characters" }),
});

export function LeadCapture({
  matches,
  answers,
}: {
  matches: ReportMatch[];
  answers?: Record<string, string | string[]>;
}) {
  const topDestinationId = matches[0]?.id;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string | undefined; email?: string | undefined }>({});
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [emailed, setEmailed] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = leadSchema.safeParse({ name, email });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ name: flat.name?.[0], email: flat.email?.[0] });
      return;
    }
    setErrors({});
    setStatus("saving");
    track("lead_submitted", { topDestinationId });
    try {
      const result = await submitLead({
        ...parsed.data,
        matches,
        ...(answers ? { answers } : {}),
      });
      setEmailed(result.reportStatus === "sent");
      setSentTo(parsed.data.email);
      setStatus("done");
      if (result.reportStatus === "sent") {
        track("report_emailed", { topDestinationId });
        toast.success("Report sent", { description: `Check ${parsed.data.email}.` });
      } else {
        toast.success("Details saved", {
          description: "We'll email your full report as soon as sending is live.",
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
          <CardTitle className="display text-xl">Want the detailed report?</CardTitle>
          <CardDescription>
            Optional. Your full results above stay visible whether or not you share your details.
            The report adds cost breakdowns, visa route notes and a research checklist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "done" ? (
            <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-background p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
              <div>
                <p className="font-medium">Thanks — you're on the list.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We've saved your request. Nothing else is required from you right now.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="lead-name">Name</Label>
                <Input
                  id="lead-name"
                  value={name}
                  maxLength={100}
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "lead-name-error" : undefined}
                />
                {errors.name && (
                  <p id="lead-name-error" role="alert" className="text-xs text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={email}
                  maxLength={255}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "lead-email-error" : undefined}
                />
                {errors.email && (
                  <p id="lead-email-error" role="alert" className="text-xs text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                <Button type="submit" disabled={status === "saving"} className="sm:w-auto">
                  <Mail aria-hidden="true" />
                  {status === "saving" ? "Sending…" : "Email my report"}
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
