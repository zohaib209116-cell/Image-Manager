import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export const useNotifications = () => {
  const { user, restaurantId, authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading || !user || !restaurantId || restaurantId.trim() === '') {
      return;
    }

    setLoading(true);

    // Correct Path Resolution: restaurants/{restaurantId}/notifications
    const notificationsRef = collection(db, 'restaurants', restaurantId, 'notifications');

    // Structured stable query referencing firestore.indexes.json
    const q = query(
      notificationsRef,
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as NotificationItem[];
        setNotifications(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        if (err.code === 'failed-precondition') {
          console.error(
            `[Firestore Index Build Required]: Composite index mismatch. Click the direct link in the Firebase crash logs to automatically instantiate it or check firestore.indexes.json. Error: ${err.message}`
          );
        } else {
          console.error(`[Firestore Query Error - useNotifications]: ${err.message}`, err);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, restaurantId, authLoading]);

  return { notifications, loading, error };
};