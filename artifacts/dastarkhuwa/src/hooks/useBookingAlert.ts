import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

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

    // Seed existing booking IDs so we don't alert on page load
    supabase
      .from("bookings")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .then(({ data }) => {
        (data || []).forEach(b => knownIdsRef.current.add(b.id));
        initializedRef.current = true;
      });

    const channel = supabase
      .channel(`booking-alerts-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          const booking = payload.new as any;
          if (!initializedRef.current) return;
          if (!knownIdsRef.current.has(booking.id)) {
            knownIdsRef.current.add(booking.id);
            playNotificationSound();
            onNewBooking?.(booking);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, onNewBooking]);
}
