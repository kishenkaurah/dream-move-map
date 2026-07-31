/**
 * Mock lead persistence layer.
 * Structured as an async repository so it can be swapped for a Lovable Cloud
 * (Supabase) table insert later without changing any component code.
 */
export interface Lead {
  id: string;
  name: string;
  email: string;
  topDestinationId?: string | undefined;
  createdAt: string;
}

const KEY = "ran.leads.v1";

export async function submitLead(input: {
  name: string;
  email: string;
  topDestinationId?: string | undefined;
}): Promise<Lead> {
  const lead: Lead = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    topDestinationId: input.topDestinationId,
    createdAt: new Date().toISOString(),
  };
  // Simulated network latency so the UI states are exercised realistically.
  await new Promise((r) => setTimeout(r, 600));
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      const all: Lead[] = raw ? JSON.parse(raw) : [];
      all.push(lead);
      window.localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }
  return lead;
}

export function listLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
