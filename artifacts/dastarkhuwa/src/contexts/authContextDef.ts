import { createContext } from "react";
import type { User } from "firebase/auth";

export interface RestaurantData {
  name?: string;
  [key: string]: any;
}

/**
 * A single restaurant owned by the logged-in user.
 * `id`      — the Firestore document key (used in security-rule path checks)
 * `queryId` — the effective ID used for subcollection paths.
 *             Equals `data.restaurantId` when the seed/admin script stored it
 *             explicitly, otherwise falls back to the Firestore document key.
 */
export interface RestaurantDoc {
  id: string;
  queryId: string;
  data: RestaurantData;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;

  // ── Multi-restaurant support ──────────────────────────────────────────────
  restaurants: RestaurantDoc[];
  /** queryId of the currently active restaurant (the key used in subcollection paths) */
  activeRestaurantId: string | null;
  /** Alias for activeRestaurantId — keeps all existing pages working without edits */
  restaurantId: string | null;
  /** Data of the currently active restaurant */
  restaurantData: RestaurantData | null;
  /** True when the user owns >1 restaurant and has not yet picked one this session */
  needsRestaurantSelection: boolean;
  setActiveRestaurant: (queryId: string) => void;

  // ── Auth actions ─────────────────────────────────────────────────────────
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
