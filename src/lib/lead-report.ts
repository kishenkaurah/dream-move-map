/**
 * Shared shape for the report we store against a lead and email to them.
 * Kept client-safe: imported by the results page, the submit endpoint and the
 * email template, so it must not pull in any server-only module.
 */
import { z } from "zod";
import type { DestinationResult } from "./scoring";

export const reportMatchSchema = z.object({
  id: z.string().max(80),
  name: z.string().max(120),
  country: z.string().max(120),
  emoji: z.string().max(8),
  overall: z.number().min(0).max(100),
  headline: z.string().max(400),
  summary: z.string().max(800),
  budgetLow: z.number().int().min(0).max(100000),
  budgetHigh: z.number().int().min(0).max(100000),
  projectedSpend: z.number().int().min(0).max(100000).nullable(),
  visaLabel: z.string().max(200),
  visaNote: z.string().max(800),
  strengths: z.array(z.string().max(300)).max(6),
  constraints: z.array(z.string().max(300)).max(6),
  investigate: z.array(z.string().max(300)).max(6),
  factors: z
    .array(
      z.object({
        label: z.string().max(80),
        score: z.number().min(0).max(100),
        weight: z.number().min(0).max(100),
      }),
    )
    .max(12),
});

export const leadSubmissionSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().email().max(255),
  matches: z.array(reportMatchSchema).min(1).max(3),
  answers: z.record(z.union([z.string(), z.array(z.string())])).optional(),
  newsletterOptIn: z.boolean().optional(),
  regionPreference: z.string().max(40).optional(),
});

export type ReportMatch = z.infer<typeof reportMatchSchema>;
export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;

/** Maps a scored result from the engine into the compact report shape. */
export function toReportMatch(result: DestinationResult): ReportMatch {
  const d = result.destination;
  return {
    id: d.id,
    name: d.name,
    country: d.country,
    emoji: d.emoji,
    overall: result.overall,
    headline: result.headline,
    summary: d.summary,
    budgetLow: result.budgetRange[0],
    budgetHigh: result.budgetRange[1],
    projectedSpend: result.projectedSpend,
    visaLabel: d.visa.label,
    visaNote: d.visa.note,
    strengths: result.strengths.slice(0, 4),
    constraints: result.constraints.slice(0, 4),
    investigate: d.investigate.slice(0, 4),
    factors: result.factors.map((f) => ({
      label: f.label,
      score: f.score,
      weight: Math.round(f.weight),
    })),
  };
}

export const formatUsd = (n: number) => `$${n.toLocaleString("en-US")}`;
