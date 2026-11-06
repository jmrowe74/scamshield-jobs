"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2, ScanSearch, ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "scamshield-welcome-dismissed";

const STEPS = [
  {
    icon: Link2,
    title: "1. Paste a job link",
    text: "Tap Analyze URL and paste the link to any job posting.",
  },
  {
    icon: ScanSearch,
    title: "2. AI reviews the posting",
    text: "We check for scam signs like upfront fees, unrealistic pay, and vague company details.",
  },
  {
    icon: ShieldCheck,
    title: "3. Get your result",
    text: "See a legitimacy score, the reasons behind it, and whether it is Legitimate, Suspicious, or a Scam.",
  },
];

interface WelcomeGuideProps {
  /** Only show for people who have not saved any analyses yet. */
  show: boolean;
}

export function WelcomeGuide({ show }: WelcomeGuideProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!show || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage unavailable; hide for this visit only */
    }
  };

  return (
    <section
      aria-label="How ScamShield Jobs works"
      className="relative bg-card border rounded-xl p-5 shadow-sm"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss guide"
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <h2 className="text-lg font-bold">Welcome to ScamShield Jobs</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Check a job posting before you share your details. It takes a few seconds.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3">
            <Icon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Results are AI-assisted guidance, not a guarantee. Always verify a company and offer
        through official sources.
      </p>
      <div className="mt-3">
        <Button variant="outline" size="sm" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </section>
  );
}
