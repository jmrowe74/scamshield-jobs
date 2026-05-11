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
  CheckCircle2, 
  Layers,
  Globe,
  PlusCircle,
  Linkedin,
  HelpCircle,
  LogIn,
  LogOut,
  User,
  FilterX,
  PlayCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  useAuth,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError
} from "@/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query,
  orderBy,
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
  'Web Audit'
];

export default function Dashboard() {
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();

  const jobsQuery = useMemoFirebase(() => {
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
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [isComplete, setIsComplete] = useState(false);
 

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
    try {
      await signOut(auth);
      toast({ title: "Signed out", description: "Your session has ended." });
    } catch (error: any) {
      toast({ title: "Error", description: "Could not sign out.", variant: "destructive" });
    }
  };

  const handleRefresh = async () => {
    if (!db) return;
    setIsRefreshing(true);
    
    try {
      // Get all reported scam jobs
      const reportedScams = jobs.filter(j => j.reported && j.classification === 'scam');
      
      if (reportedScams.length > 0) {
        // Send email alert
        const response = await fetch(`${window.location.origin}/api/send-alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobs: reportedScams })
        });

        if (response.ok) {
          toast({
            title: "📧 Alert Sent!",
            description: `Scam alert email sent with ${reportedScams.length} flagged job${reportedScams.length > 1 ? 's' : ''}.`,
          });
        } else {
          toast({
            title: "Feeds Updated",
            description: "No scam alerts to send at this time.",
          });
        }
      } else {
        toast({
          title: "Feeds Updated",
          description: "No reported scams to alert at this time.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not send alert email.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePostToLinkedin = (id: string) => {
    if (!db) return;
    const jobDoc = doc(db, "jobs", id);
    const updateData = { 
      reported: true, 
      reportedAt: new Date().toISOString() 
    };

    updateDoc(jobDoc, updateData)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: jobDoc.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
    
    toast({
      title: "Scam Reported",
      description: "This job has been manually reported and will be included in the next LinkedIn blast.",
    });
  };

  const handleAnalyzeJob = async (id: string) => {
    if (!db) return;
    const job = jobs.find(j => j.id === id);
    if (!job || isAnalyzing) return;

    setAnalyzingId(id);
    try {
      const response = await fetch(`${window.location.origin}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobUrl: job.url,
          jobTitle: job.title,
          jobDescription: job.description,
          companyName: job.company
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server error');
      }

      const result = await response.json();

      const jobDoc = doc(db, "jobs", id);
      const updateData = {
        legitimacyScore: result.legitimacyScore,
        classification: result.classification as any,
        confidence: result.confidence,
        reasoning: result.reasoning
      };

      updateDoc(jobDoc, updateData)
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: jobDoc.path,
            operation: 'update',
            requestResourceData: updateData
          }));
        });

      toast({
        title: "Analysis Complete",
        description: `Job classified as ${result.classification}.`,
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "An unexpected error occurred during AI analysis.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleAnalyzeNewUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || isAnalyzing || !db) return;

    try {
      new URL(newUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with https://",
        variant: "destructive"
      });
      return;
    }

    setAnalyzingId('new-url');
    setAnalysisProgress(0);
    setAnalysisStatus("Fetching job posting...");

    const progressSteps = [
      { progress: 15, status: "Fetching job posting...", delay: 1000 },
      { progress: 30, status: "Reading page content...", delay: 3000 },
      { progress: 50, status: "Running AI fraud analysis...", delay: 6000 },
      { progress: 70, status: "Cross-referencing company details...", delay: 10000 },
      { progress: 85, status: "Generating legitimacy score...", delay: 15000 },
      { progress: 95, status: "Finalizing audit report...", delay: 20000 },
    ];

    const timeouts: NodeJS.Timeout[] = [];
    progressSteps.forEach(({ progress, status, delay }) => {
      const timeout = setTimeout(() => {
        setAnalysisProgress(progress);
        setAnalysisStatus(status);
      }, delay);
      timeouts.push(timeout);
    });

    try {
      const response = await fetch(`${window.location.origin}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl: newUrl })
      });

      timeouts.forEach(t => clearTimeout(t));
      setAnalysisProgress(100);
      setAnalysisStatus("Audit complete!");

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server error');
      }

      const result = await response.json();

      const newJob = {
        title: result.title || "Job Audit Result",
        company: result.company || "Unknown Company",
        description: result.description || "Content fetched from URL.",
        url: newUrl,
        source: 'Web Audit',
        postedAt: new Date().toISOString(),
        legitimacyScore: result.legitimacyScore,
        classification: result.classification as any,
        confidence: result.confidence,
        reasoning: result.reasoning,
        userId: user?.uid || "anonymous"
      };

      await addDoc(collection(db, "jobs"), newJob)
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'jobs',
            operation: 'create',
            requestResourceData: newJob
          }));
        });

      setNewUrl("");
      toast({
        title: "✅ Audit Complete!",
        description: `Job classified as: ${result.classification.toUpperCase()}`,
      });
    } catch (error: any) {
      timeouts.forEach(t => clearTimeout(t));
      setAnalysisProgress(0);
      setAnalysisStatus("");
      const errorMessage = error.message || "Could not analyze the provided URL.";
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        toast({
          title: "Too Many Requests",
          description: "Please wait 1 minute before trying again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setAnalyzingId(null);
      setIsComplete(false);
      setIsDialogOpen(false);
      setAnalysisProgress(0);
      setAnalysisStatus("");
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Audit Verification Guide</DialogTitle>
                <DialogDescription>Use these scenarios to test the query and AI engine.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-primary" /> Testing Scenarios
                  </h4>
                  <ul className="text-xs space-y-3 text-muted-foreground list-disc pl-4">
                    <li><strong>Scam Identification:</strong> Search for "Entry Level" or "Data Entry". The AI should flag roles with "Telegram interviews" as scams.</li>
                    <li><strong>Source Filtering:</strong> Deselect "Indeed" in the sidebar and verify those jobs are removed from the feed.</li>
                    <li><strong>Persistence:</strong> Sign in with Google, analyze a job, and refresh the page. Audit results persist in your account.</li>
                    <li><strong>Live Audit:</strong> Paste a new URL in the "Analyze URL" tool to trigger a real-time cross-reference audit.</li>
                  </ul>
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
                <DialogDescription>Paste a job posting URL to start a live AI audit.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAnalyzeNewUrl} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Posting URL</Label>
                  <Input 
                    id="url" 
                    value={newUrl} 
                    onChange={(e) => setNewUrl(e.target.value)} 
                    placeholder="https://linkedin.com/jobs/..." 
                    required 
                    disabled={isAnalyzing}
                  />
                </div>
                {isAnalyzing && analysisProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{analysisStatus}</span>
                      <span>{analysisProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${analysisProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      This usually takes 20-30 seconds...
                    </p>
                  </div>
                )}
                {isComplete || analysisProgress === 100 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-500 font-bold">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Audit Complete!</span>
                    </div>
                    <Button 
                      type="button" 
                      className="w-full" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        setAnalysisProgress(0);
                        setAnalysisStatus("");
                        setIsComplete(false);
                        setAnalyzingId(null);
                      }}
                    >
                      Done — View Results
                    </Button>
                  </div>
                ) : (
                  <Button type="submit" className="w-full" disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {analysisStatus || "Starting analysis..."}
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Start AI Audit
                      </>
                    )}
                  </Button>
                )}
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
          <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0 px-1.5 h-4">Beta</Badge>
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
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <stat.icon className={cn("h-4 w-4 opacity-50", stat.color)} />
            </div>
            <p className="text-3xl font-bold">{loadingJobs ? "..." : stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Filters</h3>
              {(searchQuery || selectedSources.length !== SOURCES.length) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-primary px-2">
                  <FilterX className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Job, company, source..." 
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Sources</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {SOURCES.map(source => (
                  <label key={source} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors py-0.5">
                    <Checkbox 
                      checked={selectedSources.includes(source)}
                      onCheckedChange={() => toggleSource(source)}
                    />
                    <span>{source}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Postings</TabsTrigger>
              <TabsTrigger value="scams" className="text-destructive data-[state=active]:bg-destructive data-[state=active]:text-white">Flagged Scams</TabsTrigger>
              <TabsTrigger value="verified">Verified Roles</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {filteredJobs.length > 0 ? (
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
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
                  <Search className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                  <p className="font-bold text-muted-foreground">No matches found</p>
                  <p className="text-sm text-muted-foreground/60 mb-4">Try adjusting your keywords or source filters.</p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>Reset Filters</Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="scams">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.filter(j => j.classification === 'scam').map(job => (
                  <JobCard key={job.id} job={job} onAnalyze={handleAnalyzeJob} onPostToLinkedin={handlePostToLinkedin} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="verified">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.filter(j => j.classification === 'legitimate').map(job => (
                  <JobCard key={job.id} job={job} onAnalyze={handleAnalyzeJob} onPostToLinkedin={handlePostToLinkedin} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
