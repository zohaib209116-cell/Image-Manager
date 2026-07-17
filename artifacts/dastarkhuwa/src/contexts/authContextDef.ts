import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

export interface RestaurantData {
  name?: string;
  [key: string]: any;
}

export interface RestaurantDoc {
  id: string;
  queryId: string;
  data: RestaurantData;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;

  restaurants: RestaurantDoc[];
  activeRestaurantId: string | null;
  restaurantId: string | null;
  restaurantData: RestaurantData | null;
  needsRestaurantSelection: boolean;
  setActiveRestaurant: (queryId: string) => void;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
