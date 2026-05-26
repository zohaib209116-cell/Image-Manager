import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function secureLogout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (_) {}
}
