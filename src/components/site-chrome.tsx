import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

export function SiteHeader({ action }: { action?: React.ReactNode }) {
  return (
    <header className="border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="focus-ring flex min-w-0 items-center gap-2.5 rounded-md">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Compass className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="display block truncate text-base leading-tight font-semibold">
              Retire Abroad Navigator
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Independent destination guidance
            </span>
          </span>
        </Link>
        {action}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground sm:px-6">
        <p className="max-w-3xl">
          Retire Abroad Navigator provides educational, general information to help you shortlist
          places worth researching. It is not advice.
        </p>
        <p className="mt-4 text-xs">
          © {new Date().getFullYear()} Retire Abroad Navigator. All estimates are indicative.
        </p>
      </div>
    </footer>
  );
}
