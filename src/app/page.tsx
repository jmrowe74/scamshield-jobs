"use client";

import React, { useState } from "react";
import Link from "next/link";
import { JobCard } from "@/components/dashboard/JobCard";
import { MOCK_JOBS, JobPost } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Layers,
  SearchCode,
  Globe,
  MessageSquare
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { scamJobAnalysis } from "@/ai/flows/scam-job-analysis";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobPost[]>(MOCK_JOBS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scamsCount = jobs.filter(j => j.classification === 'scam').length;
  const legitimateCount = jobs.filter(j => j.classification === 'legitimate').length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Feeds Updated",
        description: "New job postings have been ingested from RSS sources.",
      });
    }, 1500);
  };

  const handlePostToLinkedin = (id: string) => {
    toast({
      title: "Scam Reported",
      description: "This job has been queued for our automated LinkedIn scam alerts.",
    });
  };

  const handleAnalyzeJob = async (id: string) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    setIsAnalyzing(true);
    try {
      const result = await scamJobAnalysis({
        jobTitle: job.title,
        jobDescription: job.description,
        companyName: job.company,
        jobUrl: job.url,
        websiteCreationDate: job.websiteCreatedAt || "2023-01-01",
        googleSearchResults: [`${job.company} legitimacy check`],
        redditSearchResults: [`r/scams ${job.company}`]
      });

      setJobs(jobs.map(j => j.id === id ? {
        ...j,
        legitimacyScore: result.legitimacyScore,
        classification: result.classification as any,
        reasoning: result.reasoning
      } : j));

      toast({
        title: "Analysis Complete",
        description: `Job re-classified as ${result.classification}.`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not process job details.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeNewUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setIsAnalyzing(true);
    setIsDialogOpen(false);
    
    try {
      // For demo purposes, we'll use consistent mock input but keyed to the provided URL
      const demoInput = {
        jobTitle: "New Analyzed Role",
        jobDescription: "Description automatically parsed from the provided URL. Requires immediate response.",
        companyName: "Analysis Target Co",
        jobUrl: newUrl,
        websiteCreationDate: "2024-01-01",
        googleSearchResults: ["Target Co Information"],
        redditSearchResults: ["r/scams search results"]
      };

      const result = await scamJobAnalysis(demoInput);

      const newJob: JobPost = {
        id: Math.random().toString(36).substr(2, 9),
        title: demoInput.jobTitle,
        company: demoInput.companyName,
        description: demoInput.jobDescription,
        url: demoInput.jobUrl,
        source: 'Indeed',
        postedAt: new Date().toISOString(),
        legitimacyScore: result.legitimacyScore,
        classification: result.classification as any,
        reasoning: result.reasoning,
        websiteCreatedAt: demoInput.websiteCreationDate
      };

      setJobs([newJob, ...jobs]);
      setNewUrl("");
      toast({
        title: "URL Analyzed",
        description: `Job classified as ${result.classification} with ${result.legitimacyScore}% score.`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not fetch or process the provided URL.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">ScamShield <span className="text-primary">Jobs</span></h1>
            <p className="text-muted-foreground font-medium">AI-Powered Job Legitimacy Analysis</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="font-semibold"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Sync RSS Feeds
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isAnalyzing} className="font-semibold shadow-md">
                {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <SearchCode className="h-4 w-4 mr-2" />}
                Analyze New URL
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Analyze Job Posting</DialogTitle>
                <DialogDescription>
                  Enter the URL of a job posting from LinkedIn, Indeed, or ZipRecruiter for real-time AI analysis.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAnalyzeNewUrl} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Job Posting URL</Label>
                  <Input 
                    id="url" 
                    placeholder="https://www.linkedin.com/jobs/view/..." 
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isAnalyzing}>
                    {isAnalyzing ? "Analyzing..." : "Start AI Audit"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Ingested</p>
            <Layers className="h-5 w-5 text-primary opacity-60" />
          </div>
          <p className="text-4xl font-bold">{jobs.length}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3 text-green-500" /> +12 from last sync
          </p>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Scams Detected</p>
            <AlertTriangle className="h-5 w-5 text-destructive opacity-60" />
          </div>
          <p className="text-4xl font-bold text-destructive">{scamsCount}</p>
          <p className="text-xs text-muted-foreground font-medium">High confidence warnings</p>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Legitimate Jobs</p>
            <CheckCircle2 className="h-5 w-5 text-green-500 opacity-60" />
          </div>
          <p className="text-4xl font-bold text-green-600">{legitimateCount}</p>
          <p className="text-xs text-muted-foreground font-medium">Verified opportunities</p>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI Checks</p>
            <RefreshCw className="h-5 w-5 text-accent opacity-60" />
          </div>
          <p className="text-4xl font-bold">482</p>
          <p className="text-xs text-muted-foreground font-medium">Last 24 hours</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sidebar Filters/Info */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-lg">Filters</h3>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search jobs/companies..." 
                  className="pl-9 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Sources</label>
                <div className="space-y-1">
                  {['LinkedIn', 'ZipRecruiter', 'Glassdoor', 'Indeed'].map(source => (
                    <label key={source} className="flex items-center gap-2 text-sm font-medium cursor-pointer py-1">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                      {source}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Automated Analysis
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every job ingested is cross-referenced with CentralOps WHOIS records, Google Search, and Reddit communities for real-time reporting.
            </p>
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold">System Health</span>
                <span className="text-green-500 font-bold uppercase">Optimal</span>
              </div>
              <div className="w-full bg-primary/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full w-[95%]" />
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Job List */}
        <main className="lg:col-span-9 space-y-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="all" className="px-6">All Posts</TabsTrigger>
                <TabsTrigger value="scams" className="px-6 text-destructive data-[state=active]:bg-destructive data-[state=active]:text-white">Detected Scams</TabsTrigger>
                <TabsTrigger value="verified" className="px-6">Verified</TabsTrigger>
              </TabsList>
              <div className="text-xs text-muted-foreground font-medium">
                Showing {filteredJobs.length} results
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onAnalyze={handleAnalyzeJob}
                    onPostToLinkedin={handlePostToLinkedin}
                  />
                ))}
                {filteredJobs.length === 0 && (
                  <div className="col-span-full py-20 text-center space-y-3 bg-white border rounded-xl">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                    <p className="text-muted-foreground font-medium">No job postings found matching your criteria.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="scams" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.filter(j => j.classification === 'scam').map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onAnalyze={handleAnalyzeJob}
                    onPostToLinkedin={handlePostToLinkedin}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="verified" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.filter(j => j.classification === 'legitimate').map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onAnalyze={handleAnalyzeJob}
                    onPostToLinkedin={handlePostToLinkedin}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
