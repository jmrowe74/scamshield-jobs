
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const auth = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ 
        title: "Reset Email Sent!", 
        description: "Check your email for password reset instructions." 
      });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    if (isSignUp && password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Account Created!", description: "Welcome to ScamShield Jobs!" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back!", description: "You are now signed in." });
      }
      onClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary p-2 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-xl">
              {isForgotPassword ? "Reset Password" : isSignUp ? "Create Account" : "Sign In"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isForgotPassword
              ? "Enter your email address to receive a reset link."
              : isSignUp 
              ? "Create your account to save audits and track job safety."
              : "Sign in to access your saved audits."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <form onSubmit={isForgotPassword ? handlePasswordReset : handleEmailAuth} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            {!isForgotPassword && (
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
              </div>
            )}
            {isSignUp && !isForgotPassword && (
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Please wait..." : isForgotPassword ? "Send Reset Email" : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm space-y-2">
            {isForgotPassword ? (
              <button className="text-primary hover:underline" onClick={() => setIsForgotPassword(false)}>Back to Sign In</button>
            ) : (
              <p className="text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button className="text-primary hover:underline" onClick={() => setIsSignUp(!isSignUp)}>
                  {isSignUp ? "Sign In" : "Create Account"}
                </button>
              </p>
            )}
            {!isForgotPassword && !isSignUp && (
              <button className="text-xs text-muted-foreground hover:underline" onClick={() => setIsForgotPassword(true)}>
                Forgot your password?
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
