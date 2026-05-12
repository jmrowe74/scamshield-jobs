"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Linkedin, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Job {
  title: string;
  company: string;
  legitimacyScore: number;
  classification: string;
  reasoning?: string;
  url: string;
}

interface LinkedInPostGeneratorProps {
  jobs: Job[];
  isOpen: boolean;
  onClose: () => void;
}

export function LinkedInPostGenerator({ jobs, isOpen, onClose }: LinkedInPostGeneratorProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const flaggedJobs = jobs.filter(j => j.reported);

  const generatePost = () => {
    const date = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const jobsList = flaggedJobs.map(job => 
      `⚠️ "${job.title}" at ${job.company || 'Unknown Company'}
   Legitimacy Score: ${job.legitimacyScore}% | Status: ${job.classification?.toUpperCase()}`
    ).join('\n\n');

    return `🚨 JOB SCAM ALERT — ${date} 🚨

I've been using ScamShield Jobs AI to analyze job postings and want to warn my professional network about these suspicious listings:

${jobsList}

🛡️ How to protect yourself:
- Never pay upfront for training or equipment
- Be wary of interviews conducted only via Telegram or WhatsApp
- Verify the company exists before sharing personal information
- Check if the salary seems unrealistically high for the role
- Look up the company domain registration date

If you've seen these postings or similar ones, please report them and warn others.

Stay safe out there! 💼

#JobScamAlert #CareerSafety #ScamShield #JobSearch #CareerAdvice #FraudAlert #JobHunting`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePost());
    setCopied(true);
    toast({
      title: "✅ Copied to Clipboard!",
      description: "Paste this post into LinkedIn to warn your network.",
    });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            Generate LinkedIn Warning Post
          </DialogTitle>
          <DialogDescription>
            Share this AI-generated warning with your professional network.
            Review and edit before posting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {flaggedJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No reported scams to share yet.</p>
              <p className="text-sm mt-1">Report suspicious jobs first using the Report button on job cards.</p>
            </div>
          ) : (
            <>
              <div className="bg-muted/30 rounded-lg p-4 border">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-3">
                  Preview — {flaggedJobs.length} flagged job{flaggedJobs.length > 1 ? 's' : ''}
                </p>
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                  {generatePost()}
                </pre>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="w-full gap-2 bg-[#0A66C2] hover:bg-[#0A66C2]/90"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open('https://www.linkedin.com/feed/', '_blank')}
                >
                  <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                  Open LinkedIn
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                💡 Tip: Copy the post, then paste it into a new LinkedIn post. 
                Feel free to edit before publishing!
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}