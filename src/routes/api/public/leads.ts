import { createFileRoute } from "@tanstack/react-router";
import { leadSubmissionSchema } from "@/lib/lead-report";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/public/leads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Invalid request body" }, 400);
        }

        const parsed = leadSubmissionSchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Please check the details you entered." }, 400);
        }
        const { name, email, matches, answers, newsletterOptIn, regionPreference } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Light abuse guard: cap repeat submissions for the same address.
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("email", normalizedEmail)
          .gte("created_at", since);

        if ((count ?? 0) >= 3) {
          return json(
            { error: "You've already requested this report a few times. Check your inbox." },
            429,
          );
        }

        const top = matches[0];
        const { data: lead, error } = await supabaseAdmin
          .from("leads")
          .insert({
            name: name ?? null,
            newsletter_opt_in: newsletterOptIn ?? false,
            region_preference: regionPreference ?? null,
            email: normalizedEmail,
            top_destination_id: top?.id ?? null,
            top_destination_label: top ? `${top.name}, ${top.country}` : null,
            top_matches: matches,
            answers: answers ?? {},
            projected_spend: top?.projectedSpend ?? null,
            report_status: "pending",
            user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
          })
          .select("id")
          .single();

        if (error || !lead) {
          console.error("[leads] insert failed", error);
          return json({ error: "We couldn't save your details. Please try again." }, 500);
        }

        const { sendReportEmail } = await import("@/lib/send-report.server");
        const outcome = await sendReportEmail({
          leadId: lead.id,
          name: name ?? normalizedEmail.split("@")[0] ?? "there",
          email: normalizedEmail,
          matches,
        });

        await supabaseAdmin
          .from("leads")
          .update({
            report_status: outcome.status,
            report_error: outcome.error ?? null,
          })
          .eq("id", lead.id);

        return json({ id: lead.id, reportStatus: outcome.status });
      },
    },
  },
});
