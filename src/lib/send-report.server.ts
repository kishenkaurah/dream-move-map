/**
 * Server-only report delivery.
 *
 * Email sending is activated once a sender domain is verified for the project.
 * Until then this records the lead as saved and reports that the report email
 * was not sent, so nothing in the submit flow fails.
 */
import type { ReportMatch } from "./lead-report";

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
  void input;
  return { status: "not_configured" };
}
