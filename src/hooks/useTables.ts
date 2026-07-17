import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export interface TableSlot {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'reserved';
  capacity: number;
}

export const useTables = () => {
  const { user, restaurantId, authLoading } = useAuth();
  const [tables, setTables] = useState<TableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Non-negotiable multi-tenant boundary safety check
    if (authLoading || !user || !restaurantId || restaurantId.trim() === '') {
      return;
    }

    setLoading(true);

    // Correct Path Resolution: restaurants/{restaurantId}/tables
    const tablesCollectionRef = collection(db, 'restaurants', restaurantId, 'tables');
    const q = query(tablesCollectionRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTables = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TableSlot[];
        setTables(fetchedTables);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`[Firestore Permission/Query Error - useTables]: ${err.message}`, err);
        setError(err);
        setLoading(false);
      }
    );

    // Guaranteed cleanup to prevent memory leaks and dangling listeners
    return () => unsubscribe();
  }, [user, restaurantId, authLoading]);

  return { tables, loading, error };
};