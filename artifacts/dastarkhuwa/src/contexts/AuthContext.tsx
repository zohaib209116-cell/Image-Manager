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

async function findRestaurant(user: User): Promise<RestaurantResult | null> {
  // Method 1: Query by ownerId field (primary — matches Firestore security rules)
  try {
    const q = query(
      collection(db, "restaurants"),
      where("ownerId", "==", user.uid),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const d = snapshot.docs[0];
      return { id: d.id, data: d.data() as RestaurantData };
    }
  } catch (e) {
    console.log("[Auth] ownerId query failed:", e);
  }

  // Method 2: Document ID == user UID
  try {
    const docSnap = await getDoc(doc(db, "restaurants", user.uid));
    if (docSnap.exists()) {
      return { id: docSnap.id, data: docSnap.data() as RestaurantData };
    }
  } catch (e) {
    console.log("[Auth] doc ID lookup failed:", e);
  }

  // Method 3: Full scan fallback (debug only)
  try {
    const allSnap = await getDocs(collection(db, "restaurants"));
    allSnap.docs.forEach(d => {
      console.log("[Auth] restaurant:", d.id, "| ownerId:", d.data().ownerId, "| match:", d.data().ownerId === user.uid);
    });
    const match = allSnap.docs.find(d =>
      d.data().ownerId === user.uid ||
      d.data().ownerId === user.uid.trim() ||
      d.id === user.uid
    );
    if (match) {
      return { id: match.id, data: match.data() as RestaurantData };
    }
  } catch (e) {
    console.log("[Auth] full scan failed:", e);
  }

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
