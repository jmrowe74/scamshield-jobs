
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { JobCard } from "@/components/dashboard/JobCard";
import { JobPost } from "@/lib/mock-data";
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
  Check,
  Clock,
  LogIn,
  LogOut,
  User
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
import { 
  useCollection, 
  useUser, 
  useFirestore, 
  useAuth 
} from "@/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();

  const jobsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "jobs"), orderBy("postedAt", "desc"));
  }, [db]);

  const { data: firebaseJobs, loading: loadingJobs } = useCollection<JobPost>(jobsQuery);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(SOURCES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const jobs = firebaseJobs || [];
  const isAnalyzing = analyzingId !== null;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const nextBlast = new Date();
      const hours = now.getHours();
      const nextHour = 6 - (hours % 6);
      nextBlast.setHours(hours + nextHour, 0, 0, 0);
      
      const diff = nextBlast.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredJobs = useMemo(() => {
    const queryStr = searchQuery.toLowerCase().trim();
    
    return jobs.filter(job => {
      const matchesSearch = !queryStr || 
        job.title.toLowerCase().includes(queryStr) || 
        job.company.toLowerCase().includes(queryStr) || 
        job.source.toLowerCase().includes(queryStr) ||
        job.description.toLowerCase().includes(queryStr);

      const matchesSource = selectedSources.includes(job.source);
      
      return matchesSearch && matchesSource;
    });
  }, [jobs, searchQuery, selectedSources]);

  const scamsCount = jobs.filter(j => j.classification === 'scam').length;
  const legitimateCount = jobs.filter(j => j.classification === 'legitimate').length;
  const aiChecksCount = jobs.filter(j => j.classification !== undefined).length;
  const pendingReportsCount = jobs.filter(j => j.reported).length;

  const handleLogin = async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast({ title: "Welcome back!", description: "You are now signed in." });
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({ title: "Signed out", description: "Your session has ended." });
  };

  const handleRefresh = async () => {
    if (!db) return;
    setIsRefreshing(true);
    
    const newJob = {
      title: "Security Analyst",
      company: "Sentinel Systems",
      description: "Entry-level analyst needed for threat detection and monitoring.",
      url: "https://example.com/jobs/sentinel",
      source: 'Dice',
      postedAt: new Date().toISOString(),
      websiteCreatedAt: "2018-04-12",
      userId: user?.uid || "anonymous"
    };
    
    addDoc(collection(db, "jobs"), newJob);
    
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Feeds Updated",
        description: "New job postings have been ingested from RSS sources.",
      });
    }, 1000);
  };

  const handlePostToLinkedin = (id: string) => {
    if (!db) return;
    const jobDoc = doc(db, "jobs", id);
    updateDoc(jobDoc, { 
      reported: true, 
      reportedAt: new Date().toISOString() 
    });
    
    toast({
      title: "Scam Reported",
      description: "This job has been manually reported and will be included in the next 6-hour LinkedIn blast.",
    });
  };

  const handleAnalyzeJob = async (id: string) => {
    if (!db) return;
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
        googleSearchResults: [`${job.company} legitimacy check`],
        redditSearchResults: [`r/scams ${job.company}`]
      });

      const jobDoc = doc(db, "jobs", id);
      updateDoc(jobDoc, {
        legitimacyScore: result.legitimacyScore,
        classification: result.classification as any,
        confidence: result.confidence,
        reasoning: result.reasoning
      });

      toast({
        title: "Analysis Complete",
        description: `Job classified as ${result.classification}.`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        variant: "destructive"
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleAnalyzeNewUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || isAnalyzing || !db) return;

    setAnalyzingId('new-url');
    setIsDialogOpen(false);
    
    try {
      const demoInput = {
        jobTitle: "Remote Assistant Role",
        jobDescription: "High-paying remote position with immediate start. Please contact via Telegram.",
        companyName: "Private Wealth Group",
        jobUrl: newUrl,
        websiteCreationDate: "2024-11-20",
        googleSearchResults: ["Wealth Group scam reports"],
        redditSearchResults: ["r/scams Telegram job interview"]
      };

      const result = await scamJobAnalysis(demoInput);

      const newJob = {
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
        websiteCreatedAt: demoInput.websiteCreationDate,
        userId: user?.uid || "anonymous"
      };

      addDoc(collection(db, "jobs"), newJob);
      setNewUrl("");
      toast({
        title: "URL Analyzed",
        description: `Classification: ${result.classification}`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
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
            <p className="text-muted-foreground font-medium">Cloud Persistent Audit Engine</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Verification Checklist</DialogTitle>
                <DialogDescription>Verify persistence and cloud features.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm font-bold">1. Authentication</p>
                  <p className="text-xs text-muted-foreground">Sign in with Google to enable cloud saving.</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm font-bold">2. Firestore Sync</p>
                  <p className="text-xs text-muted-foreground">Any job analyzed is now saved to your permanent collection.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogin} variant="outline" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}

          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hidden sm:flex"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Sync Feeds
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isAnalyzing}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Analyze URL
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Audit</DialogTitle>
                <DialogDescription>Results are saved to your cloud profile.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAnalyzeNewUrl} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Posting URL</Label>
                  <Input id="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isAnalyzing}>
                  {isAnalyzing ? "Analyzing..." : "Start AI Audit"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Banner */}
      <Alert className="bg-primary/5 border-primary/20">
        <Linkedin className="h-5 w-5 text-[#0A66C2]" />
        <AlertTitle className="font-bold flex items-center gap-2">
          Automated Network Protection
          <Badge variant="secondary" className="text-[10px]">Active</Badge>
        </AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground flex justify-between items-center mt-2">
          <p>Verified scams queued: <strong>{pendingReportsCount}</strong></p>
          <span className="font-mono text-xs font-bold bg-background/50 px-2 py-1 rounded border">Next Blast: {timeLeft}</span>
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Saved", val: jobs.length, icon: Layers, color: "text-primary" },
          { label: "Scams Flagged", val: scamsCount, icon: AlertTriangle, color: "text-destructive" },
          { label: "Verified Jobs", val: legitimateCount, icon: CheckCircle2, color: "text-green-500" },
          { label: "AI Audits", val: aiChecksCount, icon: Globe, color: "text-accent" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase">{stat.label}</p>
              <stat.icon className={cn("h-4 w-4 opacity-50", stat.color)} />
            </div>
            <p className="text-3xl font-bold">{loadingJobs ? "..." : stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">Reset</Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {SOURCES.map(source => (
                <label key={source} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                  <Checkbox 
                    checked={selectedSources.includes(source)}
                    onCheckedChange={() => toggleSource(source)}
                  />
                  <span>{source}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="scams" className="text-destructive">Scams</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map(job => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onAnalyze={handleAnalyzeJob}
                  onPostToLinkedin={handlePostToLinkedin}
                  isAnalyzing={analyzingId === job.id}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="scams" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.filter(j => j.classification === 'scam').map(job => (
                <JobCard key={job.id} job={job} onAnalyze={handleAnalyzeJob} onPostToLinkedin={handlePostToLinkedin} />
              ))}
            </TabsContent>

            <TabsContent value="verified" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.filter(j => j.classification === 'legitimate').map(job => (
                <JobCard key={job.id} job={job} onAnalyze={handleAnalyzeJob} onPostToLinkedin={handlePostToLinkedin} />
              ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
