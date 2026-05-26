import { createContext } from "react";
import type { User } from "firebase/auth";

export interface RestaurantData {
  name?: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  restaurantId: string | null;
  restaurantData: RestaurantData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
