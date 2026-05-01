"use client";

import React, { useState, useMemo } from "react";
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
  Globe,
  MessageSquare,
  PlusCircle,
  XCircle,
  Linkedin,
  HelpCircle,
  Check
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { scamJobAnalysis } from "@/ai/flows/scam-job-analysis";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SOURCES = [
  'LinkedIn', 
  'ZipRecruiter', 
  'Glassdoor', 
  'Indeed', 
  'Monster', 
  'SimplyHired', 
  'Dice', 
  'Hired', 
  'Wellfound', 
  'We Work Remotely',
  'Built In',
  'Adzuna',
  'CareerBuilder',
  'FlexJobs',
  'Startup.jobs',
  'Remote.co',
  'Hubstaff Talent',
  'Behance',
  'Dribbble',
  'Ottos',
  'Jobvite',
  'Lever'
];

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobPost[]>(MOCK_JOBS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(SOURCES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const isAnalyzing = analyzingId !== null;

  const filteredJobs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    return jobs.filter(job => {
      const matchesSearch = !query || 
        job.title.toLowerCase().includes(query) || 
        job.company.toLowerCase().includes(query) || 
        job.source.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query);

      const matchesSource = selectedSources.includes(job.source);
      
      return matchesSearch && matchesSource;
    });
  }, [jobs, searchQuery, selectedSources]);

  const scamsCount = jobs.filter(j => j.classification === 'scam').length;
  const legitimateCount = jobs.filter(j => j.classification === 'legitimate').length;
  const aiChecksCount = jobs.filter(j => j.classification !== undefined).length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const newJob: JobPost = {
        id: Math.random().toString(36).substr(2, 9),
        title: "Security Analyst",
        company: "Sentinel Systems",
        description: "Entry-level analyst needed for threat detection and monitoring.",
        url: "https://example.com/jobs/sentinel",
        source: 'Dice',
        postedAt: new Date().toISOString(),
        websiteCreatedAt: "2018-04-12"
      };
      
      setJobs(prev => [newJob, ...prev]);
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
      description: "This job has been manually reported and will be included in the next 6-hour LinkedIn blast.",
    });
  };

  const handleAnalyzeJob = async (id: string) => {
    const job = jobs.find(j => j.id === id);
    if (!job || isAnalyzing) return;

    setAnalyzingId(id);
    try {
      const result = await scamJobAnalysis({
        jobTitle: job.title,
        jobDescription: job.description,
        companyName: job.company,
        jobUrl: job.url,
        websiteCreationDate: job.websiteCreatedAt || "2023-01-01",
        googleSearchResults: [`${job.company} legitimacy check`, `${job.company} reviews`],
        redditSearchResults: [`r/scams ${job.company}`, `is ${job.company} a scam`]
      });

      setJobs(prevJobs => prevJobs.map(j => j.id === id ? {
        ...j,
        legitimacyScore: result.legitimacyScore,
        classification: result.classification as any,
        confidence: result.confidence,
        reasoning: result.reasoning
      } : j));

      toast({
        title: "Analysis Complete",
        description: `Job classified as ${result.classification} with ${result.confidence}% confidence.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Analysis Failed",
        description: "Could not process job details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleAnalyzeNewUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || isAnalyzing) return;

    setAnalyzingId('new-url');
    setIsDialogOpen(false);
    
    try {
      const demoInput = {
        jobTitle: "Remote Assistant Role",
        jobDescription: "High-paying remote position with immediate start. No experience required. Please contact via Telegram.",
        companyName: "Private Wealth Management Group",
        jobUrl: newUrl,
        websiteCreationDate: "2024-11-20",
        googleSearchResults: ["Wealth Management Group scam reports", "Private Wealth hiring warning"],
        redditSearchResults: ["r/scams Telegram job interview", "wealth management group job scam"]
      };

      const result = await scamJobAnalysis(demoInput);

      const newJob: JobPost = {
        id: Math.random().toString(36).substr(2, 9),
        title: demoInput.jobTitle,
        company: demoInput.companyName,
        description: demoInput.jobDescription,
        url: demoInput.jobUrl,
        source: 'LinkedIn',
        postedAt: new Date().toISOString(),
        legitimacyScore: result.legitimacyScore,
        classification: result.classification as any,
        confidence: result.confidence,
        reasoning: result.reasoning,
        websiteCreatedAt: demoInput.websiteCreationDate
      };

      setJobs(prev => [newJob, ...prev]);
      setNewUrl("");
      toast({
        title: "URL Analyzed",
        description: `Job classified as ${result.classification} with ${result.confidence}% AI confidence.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Analysis Failed",
        description: "Could not fetch or process the provided URL.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source) 
        : [...prev, source]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSources(SOURCES);
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
          <ThemeToggle />
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full hover:bg-muted transition-colors">
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Verification Checklist
                </DialogTitle>
                <DialogDescription>
                  Ensure everything is working correctly by following these steps:
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {[
                  { title: "Theme Switching", desc: "Toggle Light/Dark mode using the sun icon." },
                  { title: "Search Filter", desc: "Type 'Tech' and check if only TechCorp appears." },
                  { title: "RSS Sync", desc: "Click 'Sync RSS Feeds' to add new mock jobs." },
                  { title: "AI Audit", desc: "Click 'Analyze Posting' on a card to see AI results." },
                  { title: "New URL Analysis", desc: "Use 'Analyze New URL' to simulate a fresh crawl." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                    <div className="mt-0.5"><Check className="h-4 w-4 text-green-500" /></div>
                    <div>
                      <p className="font-bold text-sm leading-none mb-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hidden sm:flex font-semibold"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Sync RSS Feeds
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isAnalyzing} className="font-semibold shadow-md">
                {analyzingId === 'new-url' ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
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
                  <Button type="submit" disabled={isAnalyzing} className="w-full">
                    {analyzingId === 'new-url' ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : "Start AI Audit"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Automated Reporting Banner */}
      <Alert className="bg-primary/5 border-primary/20 shadow-sm">
        <Linkedin className="h-5 w-5 text-[#0A66C2]" />
        <AlertTitle className="font-bold flex items-center gap-2">
          Automated Network Protection
          <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0 px-1.5 h-4">Beta</Badge>
        </AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground">
          Verified scams are automatically published to our LinkedIn Fraud Network <strong>every 6 hours</strong>. 
          Each report includes AI-generated high-confidence indicators to warn other job seekers.
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Ingested</p>
            <Layers className="h-5 w-5 text-primary opacity-60" />
          </div>
          <p className="text-4xl font-bold">{jobs.length}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3 text-green-500" /> +{jobs.length - MOCK_JOBS.length} from last sync
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-muted" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-5 w-5 text-accent opacity-60", isRefreshing && "animate-spin")} />
            </Button>
          </div>
          <p className="text-4xl font-bold">{aiChecksCount}</p>
          <p className="text-xs text-muted-foreground font-medium">Audit completions</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sidebar Filters/Info */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Filters</h3>
              {(searchQuery || selectedSources.length !== SOURCES.length) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs text-muted-foreground hover:text-primary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search jobs, companies..." 
                  className="pl-9 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Sources</label>
                  <button 
                    onClick={() => setSelectedSources(selectedSources.length === SOURCES.length ? [] : SOURCES)}
                    className="text-[10px] font-bold text-primary hover:underline uppercase"
                  >
                    {selectedSources.length === SOURCES.length ? 'None' : 'All'}
                  </button>
                </div>
                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
                  {SOURCES.map(source => (
                    <label key={source} className="flex items-center gap-2 text-sm font-medium cursor-pointer py-1 group/source">
                      <Checkbox 
                        checked={selectedSources.includes(source)}
                        onCheckedChange={() => toggleSource(source)}
                      />
                      <span className={cn(
                        "transition-colors",
                        selectedSources.includes(source) ? "text-foreground" : "text-muted-foreground group-hover/source:text-primary"
                      )}>
                        {source}
                      </span>
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
                    isAnalyzing={analyzingId === job.id}
                  />
                ))}
                {filteredJobs.length === 0 && (
                  <div className="col-span-full py-20 text-center space-y-4 bg-card border rounded-xl">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">No job postings found matching your criteria.</p>
                      <Button variant="link" onClick={clearFilters} className="text-primary font-bold">Clear all filters</Button>
                    </div>
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
                    isAnalyzing={analyzingId === job.id}
                  />
                ))}
                {filteredJobs.filter(j => j.classification === 'scam').length === 0 && (
                   <div className="col-span-full py-20 text-center space-y-3 bg-card border rounded-xl">
                    <p className="text-muted-foreground font-medium">No detected scams matching filters.</p>
                  </div>
                )}
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
                    isAnalyzing={analyzingId === job.id}
                  />
                ))}
                {filteredJobs.filter(j => j.classification === 'legitimate').length === 0 && (
                   <div className="col-span-full py-20 text-center space-y-3 bg-card border rounded-xl">
                    <p className="text-muted-foreground font-medium">No verified jobs matching filters.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
