"use client";

import { getRedirectResult, signOut } from "firebase/auth";
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
  deleteDoc
} from "firebase/firestore";
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
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "jobs"), 
      where("userId", "==", user.uid),
      orderBy("postedAt", "desc")
    );
  }, [db, user?.uid]);

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
            description: "You are now signed in." 
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
        job.source.toLowerCase().includes(queryStr);

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
      const reportedScams = jobs.filter(j => j.reported && (j.classification === 'scam' || j.classification === 'suspicious')).slice(0, 10);
      if (reportedScams.length > 0) {
        const response = await fetch(`${window.location.origin}/api/send-alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            jobs: reportedScams,
            userEmail: user?.email 
          })
        });
        if (response.ok) {
          toast({ title: "Alert Sent!", description: `Scam alert email sent for ${reportedScams.length} jobs.` });
        }
      } else {
        toast({ title: "Feeds Updated", description: "No new reported scams to sync." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Sync failed.", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePostToLinkedin = (id: string) => {
    if (!db) return;
    const jobDoc = doc(db, "jobs", id);
    updateDoc(jobDoc, { reported: true, reportedAt: new Date().toISOString() }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: jobDoc.path,
        operation: 'update',
        requestResourceData: { reported: true }
      }));
    });
    toast({ title: "Reported", description: "Job reported to the network." });
  };

  const handleDeleteJob = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "jobs", id));
      toast({ title: "Deleted", description: "Job removed." });
    } catch (err: any) {
      toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
    }
  };

  const handleAnalyzeJob = async (id: string) => {
    if (!db || isAnalyzing) return;
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    setAnalyzingId(id);
    try {
      const token = await user?.getIdToken();
      const response = await fetch(`${window.location.origin}/api/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobUrl: job.url })
      });
      const result = await response.json();
      const jobDoc = doc(db, "jobs", id);
      updateDoc(jobDoc, {
        legitimacyScore: result.legitimacyScore,
        classification: result.classification,
        confidence: result.confidence,
        reasoning: result.reasoning
      }).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: jobDoc.path,
          operation: 'update',
          requestResourceData: result
        }));
      });
    } catch (err: any) {
      toast({ title: "Audit Failed", description: "AI analysis could not complete.", variant: "destructive" });
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleAnalyzeNewUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || isAnalyzing || !db || !user) return;
    setAnalyzingId('new-url');
    setAnalysisProgress(10);
    setAnalysisStatus("Initializing audit...");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${window.location.origin}/api/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          jobUrl: newUrl,
          jobTitle: manualJobTitle || undefined,
          companyName: manualCompanyName || undefined
        })
      });
      const result = await response.json();
      const newJob = {
        title: manualJobTitle || result.title || "Audit Result",
        company: manualCompanyName || result.company || "Unknown Company",
        description: result.description || "View original posting for details.",
        url: newUrl,
        source: 'Web Audit',
        postedAt: new Date().toISOString(),
        legitimacyScore: result.legitimacyScore,
        classification: result.classification,
        confidence: result.confidence,
        reasoning: result.reasoning,
        userId: user.uid
      };
      await addDoc(collection(db, "jobs"), newJob);
      setIsDialogOpen(false);
      setNewUrl("");
      setManualJobTitle("");
      setManualCompanyName("");
      toast({ title: "Audit Complete", description: "Results added to dashboard." });
    } catch (err: any) {
      toast({ title: "Error", description: "Audit failed.", variant: "destructive" });
    } finally {
      setAnalyzingId(null);
      setAnalysisProgress(0);
    }
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg group-hover:shadow-primary/30 transition-all">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">ScamShield <span className="text-primary">Jobs</span></h1>
            <p className="text-muted-foreground font-medium">Cloud Persistent Audit Engine</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
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
          {user && jobs && jobs.length > 0 && (
            <Button variant="outline" onClick={() => setIsLinkedInModalOpen(true)} className="gap-2">
              <Linkedin className="h-4 w-4" />
              Share to LinkedIn
            </Button>
          )}
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
                <DialogDescription>Paste a URL to start a live AI audit.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAnalyzeNewUrl} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Posting URL</Label>
                  <Input id="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} required placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" value={manualJobTitle} onChange={(e) => setManualJobTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company</Label>
                    <Input id="companyName" value={manualCompanyName} onChange={(e) => setManualCompanyName(e.target.value)} />
                  </div>
                </div>
                {isAnalyzing && (
                  <div className="space-y-2 py-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{analysisStatus}</span>
                      <span>{analysisProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{ width: `${analysisProgress}%` }} />
                    </div>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isAnalyzing}>
                  {isAnalyzing ? "Analyzing..." : "Start Audit"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Saved", val: jobs.length, icon: Layers, color: "text-primary" },
          { label: "Scams Flagged", val: scamsCount, icon: AlertTriangle, color: "text-destructive" },
          { label: "Suspicious", val: suspiciousCount, icon: ShieldQuestion, color: "text-amber-500" },
          { label: "Verified Jobs", val: legitimateCount, icon: CheckCircle2, color: "text-green-500" },
          { label: "AI Checks", val: aiChecksCount, icon: Globe, color: "text-accent" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase">{stat.label}</p>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
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
              <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setSelectedSources(SOURCES); }} className="h-7 text-xs">
                <FilterX className="h-3 w-3 mr-1" /> Reset
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 h-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Sources</p>
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                {SOURCES.map(source => (
                  <label key={source} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary py-0.5">
                    <Checkbox checked={selectedSources.includes(source)} onCheckedChange={() => toggleSource(source)} />
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
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="scams">Scams</TabsTrigger>
              <TabsTrigger value="suspicious">Suspicious</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map(job => (
                  <JobCard key={job.id} job={job} onAnalyze={handleAnalyzeJob} onPostToLinkedin={handlePostToLinkedin} onDelete={handleDeleteJob} isAnalyzing={analyzingId === job.id} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="scams">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.filter(j => j.classification === 'scam').map(job => (
                  <JobCard key={job.id} job={job} onAnalyze={handleAnalyzeJob} onPostToLinkedin={handlePostToLinkedin} onDelete={handleDeleteJob} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="suspicious">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.filter(j => j.classification === 'suspicious').map(job => (
                  <JobCard key={job.id} job={job} onAnalyze={handleAnalyzeJob} onPostToLinkedin={handlePostToLinkedin} onDelete={handleDeleteJob} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="verified">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.filter(j => j.classification === 'legitimate').map(job => (
                  <JobCard key={job.id} job={job} onAnalyze={handleAnalyzeJob} onPostToLinkedin={handlePostToLinkedin} onDelete={handleDeleteJob} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <LinkedInPostGenerator jobs={jobs} isOpen={isLinkedInModalOpen} onClose={() => setIsLinkedInModalOpen(false)} />
    </div>
  );
}
