"use client";

import { JobPost } from "@/lib/mock-data";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, ShieldQuestion, ExternalLink, Calendar, Linkedin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: JobPost;
  onAnalyze?: (id: string) => void;
  onPostToLinkedin?: (id: string) => void;
}

export function JobCard({ job, onAnalyze, onPostToLinkedin }: JobCardProps) {
  const getStatusIcon = () => {
    switch (job.classification) {
      case 'legitimate': return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case 'scam': return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'suspicious': return <ShieldQuestion className="h-5 w-5 text-amber-500" />;
      default: return null;
    }
  };

  const getStatusColor = () => {
    switch (job.classification) {
      case 'legitimate': return 'bg-green-100 text-green-700 border-green-200';
      case 'scam': return 'bg-red-100 text-red-700 border-red-200';
      case 'suspicious': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-destructive';
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-l-4" style={{ borderLeftColor: job.classification === 'scam' ? 'hsl(var(--destructive))' : job.classification === 'legitimate' ? 'rgb(34, 197, 94)' : 'rgb(245, 158, 11)' }}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-lg leading-tight">{job.title}</h3>
            <p className="text-sm text-muted-foreground font-medium">{job.company} • {job.source}</p>
          </div>
          {job.classification && (
            <Badge variant="outline" className={cn("flex items-center gap-1.5 px-2 py-1", getStatusColor())}>
              {getStatusIcon()}
              <span className="capitalize">{job.classification}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-4">
        <p className="text-sm line-clamp-2 text-muted-foreground">
          {job.description}
        </p>

        {job.legitimacyScore !== undefined && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground uppercase tracking-wider">Legitimacy Score</span>
              <span>{job.legitimacyScore}%</span>
            </div>
            <Progress value={job.legitimacyScore} className="h-1.5" />
          </div>
        )}

        {job.reasoning && (
          <div className="rounded-md bg-muted/50 p-3 text-xs italic text-muted-foreground border">
            "{job.reasoning}"
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Site Created: {job.websiteCreatedAt || 'Unknown'}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-muted/20 flex justify-between gap-2 border-t">
        <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            View Original
          </a>
        </Button>
        <div className="flex gap-2">
          {job.classification === 'scam' && (
            <Button variant="outline" size="sm" className="h-8 gap-1 text-[#0A66C2] hover:bg-[#0A66C2]/10" onClick={() => onPostToLinkedin?.(job.id)}>
              <Linkedin className="h-3.5 w-3.5" />
              Report
            </Button>
          )}
          {!job.classification && (
            <Button variant="primary" size="sm" className="h-8" onClick={() => onAnalyze?.(job.id)}>
              Analyze Posting
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}