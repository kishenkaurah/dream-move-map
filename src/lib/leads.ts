/**
 * Lead persistence. Submits to the server endpoint, which stores the lead in
 * the database and emails the full report.
 */
import type { ReportMatch } from "./lead-report";

export interface SubmitLeadInput {
  name: string;
  email: string;
  matches: ReportMatch[];
  answers?: Record<string, string | string[]>;
}

export interface SubmitLeadResult {
  id: string;
  reportStatus: "sent" | "suppressed" | "not_configured" | "failed";
}

export async function submitLead(input: SubmitLeadInput): Promise<SubmitLeadResult> {
  const res = await fetch("/api/public/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let body: { id?: string; reportStatus?: SubmitLeadResult["reportStatus"]; error?: string } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || !body.id) {
    throw new Error(body.error ?? "We couldn't save your details. Please try again.");
  }

  return { id: body.id, reportStatus: body.reportStatus ?? "not_configured" };
}
