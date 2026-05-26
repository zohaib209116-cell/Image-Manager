import { useEffect, useRef } from "react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playTone = (freq: number, startTime: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.15, 0.3);
    playTone(1100, now + 0.15, 0.15, 0.25);
    playTone(1320, now + 0.3, 0.25, 0.2);
  } catch {
    // Audio not supported — silent fallback
  }
}

interface UseBookingAlertOptions {
  restaurantId: string | null;
  onNewBooking?: (booking: any) => void;
}

export function useBookingAlert({ restaurantId, onNewBooking }: UseBookingAlertOptions) {
  const initializedRef = useRef(false);
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!restaurantId) return;

    const startTime = Timestamp.now();
    const q = query(
      collection(db, "bookings"),
      where("restaurantId", "==", restaurantId),
      where("createdAt", ">=", startTime)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!initializedRef.current) {
        // Seed known IDs on first load — don't alert for existing bookings
        snapshot.docs.forEach(d => knownIdsRef.current.add(d.id));
        initializedRef.current = true;
        return;
      }

      snapshot.docChanges().forEach(change => {
        if (change.type === "added" && !knownIdsRef.current.has(change.doc.id)) {
          knownIdsRef.current.add(change.doc.id);
          const booking = { id: change.doc.id, ...change.doc.data() };
          playNotificationSound();
          onNewBooking?.(booking);
        }
      });
    });

    return () => unsubscribe();
  }, [restaurantId, onNewBooking]);
}
