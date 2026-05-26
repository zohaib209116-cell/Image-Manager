import { useEffect, useState, ReactNode } from "react";
import { User, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { AuthContext, type RestaurantData } from "@/contexts/authContextDef";

interface RestaurantResult {
  id: string;
  data: RestaurantData;
}

async function findRestaurant(user: User): Promise<RestaurantResult | null> {
  // Method 1: Query by ownerId field
  try {
    const q = query(collection(db, "restaurants"), where("ownerId", "==", user.uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const d = snapshot.docs[0];
      console.log("[Auth] Found restaurant via ownerId field:", d.id);
      return { id: d.id, data: d.data() as RestaurantData };
    }
  } catch (e) {
    console.log("[Auth] Method 1 (ownerId query) failed:", e);
  }

  // Method 2: Document ID == user UID
  try {
    const docRef = doc(db, "restaurants", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("[Auth] Found restaurant via doc ID == uid:", docSnap.id);
      return { id: docSnap.id, data: docSnap.data() as RestaurantData };
    }
  } catch (e) {
    console.log("[Auth] Method 2 (doc ID lookup) failed:", e);
  }

  // Method 3: Scan all restaurants for any ownerId or id match
  try {
    const allSnap = await getDocs(collection(db, "restaurants"));
    console.log("[Auth] Scanning all restaurants:", allSnap.docs.length, "found");
    allSnap.docs.forEach(d => {
      console.log("[Auth]  ->", d.id, "| ownerId:", d.data().ownerId, "| uid:", user.uid, "| match:", d.data().ownerId === user.uid);
    });

    const match = allSnap.docs.find(d =>
      d.data().ownerId === user.uid ||
      d.data().ownerId === user.uid.trim() ||
      d.id === user.uid
    );

    if (match) {
      console.log("[Auth] Found restaurant via full scan:", match.id);
      return { id: match.id, data: match.data() as RestaurantData };
    }
  } catch (e) {
    console.log("[Auth] Method 3 (full scan) failed:", e);
  }

  console.log("[Auth] No restaurant found for UID:", user.uid);
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
        console.log("[Auth] Logged in user UID:", currentUser.uid, "| Email:", currentUser.email);
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
          await firebaseSignOut(auth);
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
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, restaurantId, restaurantData, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
