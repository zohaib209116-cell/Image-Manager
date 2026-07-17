import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

export const useStaff = () => {
  const { user, restaurantId, authLoading } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading || !user || !restaurantId || restaurantId.trim() === '') {
      return;
    }

    setLoading(true);

    // Correct Path Resolution: restaurants/{restaurantId}/staff
    const staffCollectionRef = collection(db, 'restaurants', restaurantId, 'staff');
    const q = query(staffCollectionRef, orderBy('role', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedStaff = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as StaffMember[];
        setStaff(fetchedStaff);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`[Firestore Permission/Query Error - useStaff]: ${err.message}`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, restaurantId, authLoading]);

  return { staff, loading, error };
};