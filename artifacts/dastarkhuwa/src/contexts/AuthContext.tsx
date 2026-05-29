import { useEffect, useState, ReactNode } from "react";
import { User, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getDocs, collection, query, where, limit } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { secureLogout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { AuthContext, type RestaurantData } from "@/contexts/authContextDef";

interface RestaurantResult {
  id: string;
  data: RestaurantData;
}

/**
 * Resolve the effective restaurantId for subcollection queries.
 *
 * Priority order:
 *   1. document.data.restaurantId  — explicit field set by seed scripts
 *   2. document.id                 — Firestore auto-generated doc ID
 *
 * This handles the common mismatch where seeded data uses a human-readable
 * ID like "demo_restaurant_1" stored as a field inside the document, while
 * the Firestore document itself was assigned an auto-generated key.
 */
function effectiveId(docId: string, data: RestaurantData): string {
  const fieldId = data.restaurantId as string | undefined;
  const resolved = fieldId?.trim() || docId;
  if (fieldId && fieldId !== docId) {
    console.log("[Auth] restaurantId field override:", fieldId, "(doc key:", docId, ")");
  }
  return resolved;
}

async function findRestaurant(user: User): Promise<RestaurantResult | null> {
  // ── Method 1: Query by ownerId field ─────────────────────────────────────
  try {
    const q = query(
      collection(db, "restaurants"),
      where("ownerId", "==", user.uid),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const d = snapshot.docs[0];
      const data = d.data() as RestaurantData;
      const id = effectiveId(d.id, data);
      console.log("[Auth] restaurantId resolved via ownerId query →", id);
      return { id, data };
    }
  } catch (e) {
    console.log("[Auth] ownerId query failed:", e);
  }

  // ── Method 2: Document ID == user UID ────────────────────────────────────
  try {
    const docSnap = await getDoc(doc(db, "restaurants", user.uid));
    if (docSnap.exists()) {
      const data = docSnap.data() as RestaurantData;
      const id = effectiveId(docSnap.id, data);
      console.log("[Auth] restaurantId resolved via doc ID →", id);
      return { id, data };
    }
  } catch (e) {
    console.log("[Auth] doc ID lookup failed:", e);
  }

  // ── Method 3: Full scan (logs every doc for debugging) ───────────────────
  try {
    const allSnap = await getDocs(collection(db, "restaurants"));
    console.log("[Auth] Full scan —", allSnap.docs.length, "restaurant(s) found:");
    allSnap.docs.forEach(d => {
      console.log(
        "  doc:", d.id,
        "| ownerId:", d.data().ownerId,
        "| restaurantId field:", d.data().restaurantId ?? "(none)",
        "| ownerId match:", d.data().ownerId === user.uid
      );
    });
    const match = allSnap.docs.find(d =>
      d.data().ownerId === user.uid ||
      d.data().ownerId === user.uid.trim() ||
      d.id === user.uid
    );
    if (match) {
      const data = match.data() as RestaurantData;
      const id = effectiveId(match.id, data);
      console.log("[Auth] restaurantId resolved via full scan →", id);
      return { id, data };
    }
  } catch (e) {
    console.log("[Auth] full scan failed:", e);
  }

  console.warn("[Auth] No restaurant found for UID:", user.uid);
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        console.log("[Auth] UID:", currentUser.uid);
        const result = await findRestaurant(currentUser);
        if (result) {
          setUser(currentUser);
          setRestaurantId(result.id);
          setRestaurantData(result.data);
          console.log("[Auth] Context ready | restaurantId:", result.id);
        } else {
          toast({
            title: "Access Denied",
            description: "No restaurant profile found for this account.",
            variant: "destructive",
          });
          await secureLogout();
          setUser(null);
          setRestaurantId(null);
          setRestaurantData(null);
        }
      } else {
        setUser(null);
        setRestaurantId(null);
        setRestaurantData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await secureLogout();
  };

  return (
    <AuthContext.Provider value={{ user, restaurantId, restaurantData, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
