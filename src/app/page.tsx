"use client";
import { getRedirectResult, signOut, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
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
  Download,
  Trash2
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateScamReport, generateScamReportBase64 } from "@/lib/generate-report";
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
  const [isEmailingReport, setIsEmailingReport] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

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

  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user || !user.email) return;
    setIsDeletingAccount(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);

      const jobsQuery = query(collection(db, "jobs"), where("userId", "==", user.uid));
      const snapshot = await getDocs(jobsQuery);
      await Promise.all(snapshot.docs.map((d) => deleteDoc(doc(db, "jobs", d.id))));

      await deleteUser(user);
      await signOut(auth);
      toast({ title: "Account deleted", description: "Your account and all data have been permanently removed." });
    } catch (error: any) {
      toast({ title: "Error", description: error.code === "auth/invalid-credential" ? "Incorrect password. Please try again." : (error.message || "Could not delete account."), variant: "destructive" });
    } finally {
      setIsDeletingAccount(false);
      setDeletePassword("");
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

  const handleEmailReport = async () => {
    if (!user || jobs.length === 0) return;
    setIsEmailingReport(true);
    try {
      const token = await user.getIdToken();
      const pdfBase64 = generateScamReportBase64(jobs, user.email || "Unknown user");
      const response = await fetch(`${window.location.origin}/api/email-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pdfBase64 }),
      });
      if (response.ok) {
        toast({ title: "Report Sent", description: `Emailed to ${user.email}.` });
      } else {
        toast({ title: "Error", description: "Could not send report.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Could not send report.", variant: "destructive" });
    } finally {
      setIsEmailingReport(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!user || jobs.length === 0) return;
    setIsDownloadingReport(true);
    toast({ title: "Preparing report...", description: "Your PDF is being generated." });
    try {
      await generateScamReport(jobs, user.email || "Unknown user");
      toast({ title: "Report Ready", description: "Choose where to save or share it." });
    } catch (err: any) {
      toast({ title: "Error", description: "Could not generate report.", variant: "destructive" });
    } finally {
      setIsDownloadingReport(false);
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Analyze URL - highest priority, always shown first */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isAnalyzing} className="order-1">
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

          {/* Theme toggle - lower priority on mobile */}
          <div className="order-4 sm:order-2">
            <ThemeToggle />
          </div>

          {user ? (
            <div className="flex flex-wrap items-center gap-3 order-5 sm:order-3">
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes your account and all saved audits. This cannot be undone. Enter your password to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletePassword("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={!deletePassword || isDeletingAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingAccount ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <Button onClick={() => setIsAuthModalOpen(true)} variant="outline" className="gap-2 order-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}

          {user && jobs && jobs.length > 0 && (
            <Button variant="outline" onClick={() => setIsLinkedInModalOpen(true)} className="gap-2 order-3 sm:order-4">
              <Linkedin className="h-4 w-4" />
              Share to LinkedIn
            </Button>
          )}

          {user && jobs && jobs.length > 0 && (
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              disabled={isDownloadingReport}
              className="gap-2 order-3 sm:order-5"
            >
              <Download className="h-4 w-4" />
              {isDownloadingReport ? "Preparing..." :
