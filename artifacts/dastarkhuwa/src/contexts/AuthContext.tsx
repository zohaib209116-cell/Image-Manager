import { useEffect, useState, useCallback, ReactNode } from "react";
import { User, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { secureLogout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { AuthContext, type RestaurantData, type RestaurantDoc } from "@/contexts/authContextDef";

// ── localStorage key ────────────────────────────────────────────────────────
const STORAGE_KEY = "dastarkhuwa_active_restaurant";

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute the effective subcollection path key for a restaurant document.
 * Seed scripts often store `restaurantId: "demo_restaurant_1"` inside the
 * document body; if present we honour it, otherwise we use the doc key.
 */
function resolveQueryId(docId: string, data: RestaurantData): string {
  const fieldId = (data.restaurantId as string | undefined)?.trim();
  if (fieldId && fieldId !== docId) {
    console.log("[Auth] queryId override from data.restaurantId:", fieldId, "(doc key:", docId + ")");
  }
  return fieldId || docId;
}

/**
 * Load every restaurant owned by this user.
 * Tries three methods in order so the app works regardless of how the
 * restaurant document was created.
 */
async function loadOwnerRestaurants(user: User): Promise<RestaurantDoc[]> {
  const seen = new Set<string>();
  const results: RestaurantDoc[] = [];

  const add = (docId: string, data: RestaurantData) => {
    if (seen.has(docId)) return;
    seen.add(docId);
    results.push({ id: docId, queryId: resolveQueryId(docId, data), data });
  };

  // Method 1 — ownerId field query (fast, covers most real documents)
  try {
    const q = query(collection(db, "restaurants"), where("ownerId", "==", user.uid));
    const snap = await getDocs(q);
    snap.docs.forEach(d => add(d.id, d.data() as RestaurantData));
    console.log("[Auth] Method 1 (ownerId query) →", snap.docs.length, "doc(s)");
  } catch (e) {
    console.warn("[Auth] Method 1 failed:", e);
  }

  // Method 2 — document key == user UID (legacy pattern)
  if (results.length === 0) {
    try {
      const docSnap = await getDoc(doc(db, "restaurants", user.uid));
      if (docSnap.exists()) {
        add(docSnap.id, docSnap.data() as RestaurantData);
        console.log("[Auth] Method 2 (doc key == uid) found restaurant");
      }
    } catch (e) {
      console.warn("[Auth] Method 2 failed:", e);
    }
  }

  // Method 3 — full collection scan (last resort; logs every doc for debugging)
  if (results.length === 0) {
    try {
      const allSnap = await getDocs(collection(db, "restaurants"));
      console.log("[Auth] Method 3 full scan —", allSnap.docs.length, "total restaurant(s):");
      allSnap.docs.forEach(d => {
        const data = d.data();
        const match = data.ownerId === user.uid || data.ownerId === user.uid.trim() || d.id === user.uid;
        console.log(
          "  doc:", d.id,
          "| ownerId:", data.ownerId ?? "(none)",
          "| restaurantId field:", data.restaurantId ?? "(none)",
          "| match:", match
        );
        if (match) add(d.id, data as RestaurantData);
      });
    } catch (e) {
      console.warn("[Auth] Method 3 failed:", e);
    }
  }

  console.log(
    "[Auth] Restaurants for", user.uid, "→",
    results.map(r => `${r.id} (queryId: ${r.queryId})`).join(", ") || "none"
  );
  return results;
}

// ── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        console.log("[Auth] UID:", currentUser.uid);
        const found = await loadOwnerRestaurants(currentUser);

        if (found.length === 0) {
          toast({
            title: "Access Denied",
            description: "No restaurant profile found for this account.",
            variant: "destructive",
          });
          await secureLogout();
          setUser(null);
          setRestaurants([]);
          setActiveQueryId(null);
          localStorage.removeItem(STORAGE_KEY);
        } else {
          setUser(currentUser);
          setRestaurants(found);

          if (found.length === 1) {
            // Single restaurant — auto-select, no picker needed
            const id = found[0].queryId;
            setActiveQueryId(id);
            localStorage.setItem(STORAGE_KEY, id);
            console.log("[Auth] Auto-selected (single restaurant):", id);
          } else {
            // Multiple restaurants — restore saved choice or require selection
            const stored = localStorage.getItem(STORAGE_KEY);
            const valid = stored ? found.find(r => r.queryId === stored) : null;
            if (valid) {
              setActiveQueryId(valid.queryId);
              console.log("[Auth] Restored restaurant from localStorage:", valid.queryId);
            } else {
              setActiveQueryId(null);
              localStorage.removeItem(STORAGE_KEY);
              console.log("[Auth] Multiple restaurants — awaiting user selection");
            }
          }
        }
      } else {
        // Signed out — wipe everything
        setUser(null);
        setRestaurants([]);
        setActiveQueryId(null);
        localStorage.removeItem(STORAGE_KEY);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const setActiveRestaurant = useCallback((queryId: string) => {
    setRestaurants(prev => {
      const found = prev.find(r => r.queryId === queryId);
      if (!found) {
        console.warn("[Auth] setActiveRestaurant: unknown queryId:", queryId);
        return prev;
      }
      setActiveQueryId(queryId);
      localStorage.setItem(STORAGE_KEY, queryId);
      console.log("[Auth] Active restaurant switched to:", queryId);
      return prev;
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const logout = useCallback(async () => {
    await secureLogout();
  }, []);

  const activeRestaurant = restaurants.find(r => r.queryId === activeQueryId) ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        restaurants,
        activeRestaurantId: activeQueryId,
        restaurantId: activeQueryId,            // backward-compat alias
        restaurantData: activeRestaurant?.data ?? null,
        needsRestaurantSelection:
          !loading && user !== null && restaurants.length > 1 && activeQueryId === null,
        setActiveRestaurant,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
