"use client";
import { getRedirectResult } from "firebase/auth";
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
  PlayCircle,
  ShieldQuestion,
  Download
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
  where,
} from "firebase/firestore";
import { 
  signOut 
} from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateScamReport } from "@/lib/generate-report";
import { AuthModal } from "@/components/auth/AuthModal";
import { LinkedInPostGenerator } from "@/components/dashboard/LinkedInPostGenerator";

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
    if (!db || !user) return null;
    return query(
      collection(db, "jobs"), 
      where("userId", "==", user.uid),
      orderBy("postedAt", "desc")
    );
  }, [db, user]);

  const { data: firebaseJobs, loading: loadingJobs } = useCollection<JobPost>(jobsQuery);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(SOURCES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [manualJobTitle, setManualJobTitle] = useState("");
  const [manualCompanyName, setManualCompanyName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);

  const jobs = firebaseJobs || [];
  const isSignedIn = !!user;
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

  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          toast({ 
            title: "Welcome!", 
            description: "You are now signed in with Google." 
          });
        }
      })
      .catch((error) => {
        console.error("Redirect error:", error);
      });
  }, [auth, toast]);

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
  const suspiciousCount = jobs.filter(j => j.classification === 'suspicious').length;
  const legitimateCount = jobs.filter(j => j.classification === 'legitimate').length;
  const aiChecksCount = jobs.filter(j => j.classification !== undefined).length;
  const pendingReportsCount = jobs.filter(j => j.reported).length;

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
      const reportedScams = jobs.filter(j => j.reported && (j.classification === 'scam' || j.classification === 'suspicious'));
      
      if (reportedScams.length > 0) {
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

  const handleDeleteJob = async (id: string) => {
    if (!db) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const jobDoc = doc(db, "jobs", id);
      await deleteDoc(jobDoc);
      toast({
        title: "Job Deleted",
        description: "The job card has been removed from your dashboard.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not delete this job.",
        variant: "destructive"
      });
    }
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
    if (!newUrl || isAnalyzing || !db || !user) return;

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
        body: JSON.stringify({ 
          jobUrl: newUrl,
          jobTitle: manualJobTitle || undefined,
          companyName: manualCompanyName || undefined
        })
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
        userId: user.uid
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
      setManualJobTitle("");
      setManualCompanyName("");
      toast({
        title: "✅ Audit Complete!",
        description: `Job classified as: ${result.classification.toUpperCase()}`,
      });
    } catch (error: any) {
      timeouts.forEach(t => clearTimeout(t));
      setAnalysisProgress(0);
      setAnalysisStatus("");
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze the provided URL.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingId(null);
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
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={user.photoURL || ""} />
                  <AvatarFallback className="bg-primary text-white text-sm font-bold">
                    {user.email?.charAt(0).toUpperCase() || <User />}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium leading-none">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsAuthModalOpen(true)} variant="outline" className="gap-2">
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
          
          <Button 
            variant="outline" 
            onClick={() => generateScamReport(jobs)}
            disabled={jobs.length === 0}
            className="hidden sm:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
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
                {(newUrl.includes('ziprecruiter.com/jobs/v2') || newUrl.includes('indeed.com/viewjob')) && !manualJobTitle && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-600">
                    ⚠️ This URL type requires a login to access. Please enter the <strong>Job Title</strong> and <strong>Company Name</strong> below for best results.
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title <span className="text-muted-foreground text-xs">(optional but recommended)</span></Label>
                  <Input 
                    id="jobTitle" 
                    value={manualJobTitle} 
                    onChange={(e) => setManualJobTitle(e.target.value)} 
                    placeholder="e.g. Cybersecurity Analyst" 
                    disabled={isAnalyzing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name <span className="text-muted-foreground text-xs">(optional but recommended)</span></Label>
                  <Input 
                    id="companyName" 
                    value={manualCompanyName} 
                    onChange={(e) => setManualCompanyName(e.target.value)} 
                    placeholder="e.g. Lockheed Martin" 
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
        <AlertDescription className="text-sm text-muted-foreground mt-2">
          <div className="flex justify-between items-center">
            <p>Verified scams queued: <strong>{pendingReportsCount}</strong></p>
            <span className="font-mono text-xs font-bold bg-background/50 px-2 py-1 rounded border">Next Blast: {timeLeft}</span>
          </div>
          {pendingReportsCount > 0 && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 text-[#0A66C2] border-[#0A66C2]/30 hover:bg-[#0A66C2]/10"
                onClick={() => setIsLinkedInModalOpen(true)}
              >
                <Linkedin className="h-4 w-4" />
                Generate LinkedIn Warning Post
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Saved", val: jobs.length, icon: Layers, color: "text-primary" },
          { label: "Scams Flagged", val: scamsCount, icon: AlertTriangle, color: "text-destructive" },
          { label: "Suspicious", val: suspiciousCount, icon: ShieldQuestion, color: "text-amber-500" },
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
          {!isSignedIn && (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
              <Shield className="h-10 w-10 text-primary mb-4 opacity-50" />
              <p className="font-bold text-muted-foreground">Sign in to view your audits</p>
              <p className="text-sm text-muted-foreground/60 mb-4">Create an account or sign in to start analyzing job postings.</p>
              <Button onClick={() => setIsAuthModalOpen(true)}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Get Started
              </Button>
            </div>
          )}
          
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Postings</TabsTrigger>
              <TabsTrigger value="scams" className="text-destructive data-[state=active]:bg-destructive data-[state=active]:text-white">Flagged Scams</TabsTrigger>
              <TabsTrigger value="suspicious" className="text-amber-500 data-[state=active]:bg-amber-500 data-[state=active]:text-white">Suspicious</TabsTrigger>
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
                      onDelete={handleDeleteJob}
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
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onAnalyze={handleAnalyzeJob}
                    onPostToLinkedin={handlePostToLinkedin}
                    onDelete={handleDeleteJob} 
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="suspicious">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.filter(j => j.classification === 'suspicious').map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onAnalyze={handleAnalyzeJob}
                    onPostToLinkedin={handlePostToLinkedin}
                    onDelete={handleDeleteJob} 
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="verified">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.filter(j => j.classification === 'legitimate').map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onAnalyze={handleAnalyzeJob}
                    onPostToLinkedin={handlePostToLinkedin}
                    onDelete={handleDeleteJob} 
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      
      <LinkedInPostGenerator
        jobs={jobs}
        isOpen={isLinkedInModalOpen}
        onClose={() => setIsLinkedInModalOpen(false)}
      />
    </div>
  );
}
