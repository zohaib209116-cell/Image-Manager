import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

/**
 * Login page.
 *
 * Delegates ALL restaurant lookup and access-denied logic to AuthContext —
 * no duplicate Firestore queries here. After signInWithEmailAndPassword
 * resolves, onAuthStateChanged in AuthContext will:
 *   • load the user's restaurants
 *   • auto-select if there is exactly one
 *   • set needsRestaurantSelection = true if there are multiple
 *   • call secureLogout + show toast if there are none
 *
 * ProtectedRoute handles the redirect / selector gating.
 */
export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await login(email, password);
      // Navigation is handled by ProtectedRoute reacting to auth state change.
    } catch (error: any) {
      const code = error?.code as string | undefined;
      const message =
        code === "auth/invalid-credential" || code === "auth/wrong-password"
          ? "Incorrect email or password."
          : code === "auth/user-not-found"
          ? "No account found with this email."
          : code === "auth/too-many-requests"
          ? "Too many attempts. Please wait a moment and try again."
          : "Sign in failed. Please try again.";
      toast({ title: "Login Failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl border border-border shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center font-bold text-2xl text-primary-foreground mb-4">
            D
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dastarkhuwa</h1>
          <p className="text-muted-foreground">Owner Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              data-testid="input-email"
              type="email"
              placeholder="owner@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-input border-border"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-input border-border"
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            data-testid="button-signin"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
