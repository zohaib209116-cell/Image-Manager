// ─── Input Sanitization ───────────────────────────────────────────────────────

export function sanitizeStr(value: unknown, maxLen = 500): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/[<>]/g, "") // strip HTML angle brackets
    .slice(0, maxLen);
}

export function sanitizeNum(value: unknown, min: number, max: number): number | null {
  const n = Number(value);
  if (!isFinite(n) || isNaN(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

// ─── Allowed Enums ────────────────────────────────────────────────────────────

export const VALID_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "completed",
  "cancelled",
] as const;
export type BookingStatus = (typeof VALID_BOOKING_STATUSES)[number];

export function isValidBookingStatus(s: unknown): s is BookingStatus {
  return VALID_BOOKING_STATUSES.includes(s as BookingStatus);
}

export const VALID_MENU_CATEGORIES = [
  "Starters",
  "Main Course",
  "Desserts",
  "Drinks",
  "Deals",
] as const;

export function isValidMenuCategory(s: unknown): boolean {
  return VALID_MENU_CATEGORIES.includes(s as any);
}

export const VALID_STAFF_ROLES = [
  "Manager",
  "Chef",
  "Waiter",
  "Cashier",
] as const;

export function isValidStaffRole(s: unknown): boolean {
  return VALID_STAFF_ROLES.includes(s as any);
}

export const VALID_TABLE_STATUSES = [
  "available",
  "occupied",
  "reserved",
  "maintenance",
] as const;

export function isValidTableStatus(s: unknown): boolean {
  return VALID_TABLE_STATUSES.includes(s as any);
}

export const VALID_TABLE_LOCATIONS = [
  "indoor",
  "outdoor",
  "rooftop",
  "patio",
] as const;

export function isValidTableLocation(s: unknown): boolean {
  return VALID_TABLE_LOCATIONS.includes(s as any);
}

// ─── File Upload Validation ───────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateUploadFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "Only JPG, PNG, and WEBP images are allowed.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "File must be under 5 MB.";
  }
  return null;
}

// ─── Safe Error Messages ──────────────────────────────────────────────────────

export function safeErrorMessage(error: unknown): string {
  // Never expose raw Firebase internals or stack traces
  if (error instanceof Error) {
    const code = (error as any)?.code as string | undefined;
    if (code === "permission-denied") return "You do not have permission to perform this action.";
    if (code === "unavailable") return "Service temporarily unavailable. Please try again.";
    if (code === "not-found") return "The requested record was not found.";
    if (code?.startsWith("auth/")) return "Authentication error. Please sign in again.";
  }
  return "An unexpected error occurred. Please try again.";
}

// ─── Permission-Denied Auto-Logout Helper ────────────────────────────────────

export function isPermissionDenied(error: unknown): boolean {
  return (error as any)?.code === "permission-denied";
}
