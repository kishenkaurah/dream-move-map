/**
 * Server-only report delivery.
 *
 * Sends the research-plan email through Lovable's managed email API once the
 * sender domain is verified. Suppression and rate limits are handled by Lovable.
 */
import type { ReportMatch } from "./lead-report";
import { sendTemplateEmail } from "./email-templates/send-email";

export interface SendReportInput {
  leadId: string;
  name: string;
  email: string;
  matches: ReportMatch[];
}

export interface SendReportOutcome {
  status: "sent" | "suppressed" | "not_configured" | "failed";
  error?: string;
}

export async function sendReportEmail(input: SendReportInput): Promise<SendReportOutcome> {
  const top = input.matches[0];
  if (!top) {
    return { status: "failed", error: "No matches to send" };
  }

  try {
    const result = await sendTemplateEmail(
      "research-plan",
      input.email,
      {
        idempotencyKey: `research-plan-${input.leadId}`,
        templateData: {
          name: input.name,
          topDestination: top.name,
          topCountry: top.country,
          projectedSpend: top.projectedSpend,
          siteUrl: "https://retireabroad.me",
          matches: input.matches.map((m) => ({
            name: m.name,
            country: m.country,
            emoji: m.emoji,
            overall: m.overall,
            headline: m.headline,
            budgetLow: m.budgetLow,
            budgetHigh: m.budgetHigh,
            projectedSpend: m.projectedSpend,
            visaLabel: m.visaLabel,
            visaNote: m.visaNote,
            strengths: m.strengths.slice(0, 3),
          })),
        },
      },
    );

    if (result.sent) {
      return { status: "sent" };
    }
    return { status: "suppressed" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[sendReportEmail] failed", { leadId: input.leadId, error: message });
    return { status: "failed", error: message };
  }
}
