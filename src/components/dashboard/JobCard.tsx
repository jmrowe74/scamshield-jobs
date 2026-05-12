"use client";

import { JobPost } from "@/lib/mock-data";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, ShieldQuestion, ExternalLink, Calendar, Linkedin, Info, RefreshCw, CheckCircle, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JobCardProps {
  job: JobPost;
  onAnalyze?: (id: string) => void;
  onPostToLinkedin?: (id: string) => void;
  onDelete?: (id: string) => void;
  isAnalyzing?: boolean;
}

export function JobCard({ job, onAnalyze, onPostToLinkedin, onDelete, isAnalyzing }: JobCardProps) {
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
      case 'legitimate': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'scam': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'suspicious': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { label: 'High Confidence', color: 'text-green-500' };
    if (score >= 70) return { label: 'Medium Confidence', color: 'text-amber-500' };
    return { label: 'Low Confidence', color: 'text-muted-foreground' };
  };

  const borderLeftColor = job.classification === 'scam' 
    ? 'hsl(var(--destructive))' 
    : job.classification === 'legitimate' 
      ? 'rgb(34, 197, 94)' 
      : job.classification === 'suspicious' 
        ? 'rgb(245, 158, 11)' 
        : 'hsl(var(--border))';

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-l-4 flex flex-col h-full" style={{ borderLeftColor }}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-bold text-lg leading-tight">{job.title}</h3>
            <p className="text-sm text-muted-foreground font-medium">{job.company} • {job.source}</p>
          </div>
          {job.classification && (
            <Badge variant="outline" className={cn("flex items-center gap-1.5 px-2 py-1 shrink-0", getStatusColor())}>
              {getStatusIcon()}
              <span className="capitalize">{job.classification}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-4 flex-grow">
        <p className="text-sm line-clamp-2 text-muted-foreground">
          {job.description}
        </p>

        {job.legitimacyScore !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground uppercase tracking-wider">Legitimacy Score</span>
              <span>{job.legitimacyScore}%</span>
            </div>
            <div className="relative w-full">
              <Progress value={job.legitimacyScore} className="h-1.5" />
            </div>
            
            {job.confidence !== undefined && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Verdict:</span>
                <span className={cn("text-[10px] font-extrabold uppercase", getConfidenceLevel(job.confidence).color)}>
                  {getConfidenceLevel(job.confidence).label} ({job.confidence}%)
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-[10px]">How sure the AI is about this classification based on cross-referenced data.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        )}

        {job.reasoning && (
          <div className="rounded-md bg-muted/50 p-3 text-xs italic text-muted-foreground border">
            "{job.reasoning}"
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1">
    <Calendar className="h-3 w-3" />
    <span>Analyzed: {job.postedAt ? new Date(job.postedAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}</span>
  </div>
</div>
      </CardContent>

      <CardFooter className="p-4 bg-muted/20 flex justify-between gap-2 border-t mt-auto">
      <div className="flex items-center gap-2">
  <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
    <a href={job.url} target="_blank" rel="noopener noreferrer">
      <ExternalLink className="h-3.5 w-3.5" />
      View Original
    </a>
  </Button>
  <Button 
    variant="ghost" 
    size="sm" 
    className="h-8 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
    onClick={() => onDelete?.(job.id)}
  >
    <Trash2 className="h-3.5 w-3.5" />
    Delete
  </Button>
</div>
        <div className="flex gap-2">
          {(job.classification === 'scam' || job.classification === 'suspicious') && (
            <Button 
              variant={job.reported ? "secondary" : "outline"} 
              size="sm" 
              className={cn(
                "h-8 gap-1 transition-colors", 
                job.reported ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-[#0A66C2] hover:bg-[#0A66C2]/10"
              )} 
              onClick={() => onPostToLinkedin?.(job.id)}
              disabled={job.reported}
            >
              {job.reported ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Reported
                </>
              ) : (
                <>
                  <Linkedin className="h-3.5 w-3.5" />
                  Report
                </>
              )}
            </Button>
          )}
          {!job.classification && (
            <Button 
              variant="default" 
              size="sm" 
              className="h-8" 
              onClick={() => onAnalyze?.(job.id)}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                  Auditing...
                </>
              ) : "Analyze Posting"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
