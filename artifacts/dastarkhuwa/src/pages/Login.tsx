import { useState } from "react";
import { useLocation } from "wouter";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { getDocs, getDoc, collection, query, where, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

async function restaurantExists(uid: string): Promise<boolean> {
  // Method 1: ownerId field
  try {
    const snap = await getDocs(query(collection(db, "restaurants"), where("ownerId", "==", uid)));
    if (!snap.empty) return true;
  } catch (_) {}

  // Method 2: doc ID == uid
  try {
    const snap = await getDoc(doc(db, "restaurants", uid));
    if (snap.exists()) return true;
  } catch (_) {}

  // Method 3: full scan
  try {
    const all = await getDocs(collection(db, "restaurants"));
    const found = all.docs.some(d => d.data().ownerId === uid || d.id === uid);
    if (found) return true;
  } catch (_) {}

  return false;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;
      console.log("[Login] Signed in UID:", uid);

      const found = await restaurantExists(uid);
      if (!found) {
        await auth.signOut();
        toast({
          title: "Access Denied",
          description: "No restaurant profile found for this account.",
          variant: "destructive",
        });
        return;
      }
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
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
