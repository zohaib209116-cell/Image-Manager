import { useEffect, useState, ReactNode } from "react";
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { AuthContext, type RestaurantData } from "@/contexts/authContextDef";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<import("firebase/auth").User | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const docRef = doc(db, "restaurants", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUser(currentUser);
            setRestaurantId(currentUser.uid);
            setRestaurantData(docSnap.data() as RestaurantData);
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
        } catch (error) {
          console.error("Error fetching user data", error);
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
