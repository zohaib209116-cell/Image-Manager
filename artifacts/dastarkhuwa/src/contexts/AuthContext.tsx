import { useEffect, useState, useCallback, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { secureLogout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { AuthContext, type RestaurantData, type RestaurantDoc } from "@/contexts/authContextDef";

const SINGLE_KEY = "dastarkhuwa_restaurant";
const MULTI_KEY  = "dastarkhuwa_session_restaurant";

async function loadOwnerRestaurants(userId: string): Promise<RestaurantDoc[]> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", userId);
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id as string,
      queryId: row.id as string,
      data: row as RestaurantData,
    }));
  } catch (e) {
    console.warn("[Auth] Failed to load restaurants:", e);
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleUserSession = useCallback(async (currentUser: User) => {
    setLoading(true);
    const found = await loadOwnerRestaurants(currentUser.id);
    console.log("[Auth] UID:", currentUser.id, "→ restaurants:", found.map(r => r.id).join(", ") || "none");

    if (found.length === 0) {
      toast({ title: "Access Denied", description: "No restaurant profile found for this account.", variant: "destructive" });
      await secureLogout();
      setUser(null);
      setRestaurants([]);
      setActiveQueryId(null);
      localStorage.removeItem(SINGLE_KEY);
      setLoading(false);
      return;
    }

    setUser(currentUser);
    setRestaurants(found);

    if (found.length === 1) {
      const id = found[0].queryId;
      setActiveQueryId(id);
      localStorage.setItem(SINGLE_KEY, id);
      sessionStorage.removeItem(MULTI_KEY);
      console.log("[Auth] Auto-selected (single restaurant):", id);
    } else {
      localStorage.removeItem(SINGLE_KEY);
      const session = sessionStorage.getItem(MULTI_KEY);
      const valid = session ? found.find(r => r.queryId === session) : null;
      if (valid) {
        setActiveQueryId(valid.queryId);
        console.log("[Auth] Restored restaurant from session:", valid.queryId);
      } else {
        setActiveQueryId(null);
        console.log("[Auth] Multiple restaurants — showing picker");
      }
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    // Bootstrap from existing session first to avoid flicker on reload
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setUser(null);
        setRestaurants([]);
        setActiveQueryId(null);
        localStorage.removeItem(SINGLE_KEY);
        sessionStorage.removeItem(MULTI_KEY);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [handleUserSession]);

  const setActiveRestaurant = useCallback((queryId: string) => {
    setRestaurants(prev => {
      const found = prev.find(r => r.queryId === queryId);
      if (!found) { console.warn("[Auth] setActiveRestaurant: unknown queryId:", queryId); return prev; }
      setActiveQueryId(queryId);
      if (prev.length === 1) localStorage.setItem(SINGLE_KEY, queryId);
      else sessionStorage.setItem(MULTI_KEY, queryId);
      console.log("[Auth] Active restaurant switched to:", queryId);
      return prev;
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => { await secureLogout(); }, []);

  const activeRestaurant = restaurants.find(r => r.queryId === activeQueryId) ?? null;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      restaurants,
      activeRestaurantId: activeQueryId,
      restaurantId: activeQueryId,
      restaurantData: activeRestaurant?.data ?? null,
      needsRestaurantSelection: !loading && user !== null && restaurants.length > 1 && activeQueryId === null,
      setActiveRestaurant,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
