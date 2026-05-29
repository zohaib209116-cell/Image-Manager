import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { RestaurantSelector } from "@/components/RestaurantSelector";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, needsRestaurantSelection } = useAuth();

  // Auth (+ restaurant list) is still loading
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Signed in but owns multiple restaurants and hasn't picked one yet
  if (needsRestaurantSelection) {
    return <RestaurantSelector />;
  }

  return <>{children}</>;
}
