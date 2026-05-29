import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, LogOut } from "lucide-react";

/**
 * Full-screen restaurant picker.
 * Shown by ProtectedRoute when the user owns more than one restaurant
 * and has not yet selected one for this session.
 */
export function RestaurantSelector() {
  const { restaurants, setActiveRestaurant, logout } = useAuth();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center font-bold text-2xl text-primary-foreground mb-4">
            D
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Select Restaurant</h1>
          <p className="text-muted-foreground text-sm">
            You manage {restaurants.length} restaurants. Choose one to continue.
          </p>
        </div>

        {/* Restaurant cards */}
        <div className="space-y-3">
          {restaurants.map((r) => (
            <Card
              key={r.queryId}
              className="cursor-pointer border border-border hover:border-primary hover:shadow-md hover:shadow-primary/10 transition-all duration-150"
              onClick={() => setActiveRestaurant(r.queryId)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {r.data.name || r.queryId}
                  </p>
                  {r.data.address && (
                    <p className="text-xs text-muted-foreground truncate">{r.data.address}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sign out */}
        <div className="pt-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
