const admin = require("firebase-admin");

// ---------------- LOAD FIREBASE FROM REPLIT SECRETS ----------------
const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!raw) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT in Replit Secrets");
}

if (raw.includes("Paste full")) {
  throw new Error("Firebase secret not configured properly");
}

const serviceAccount = JSON.parse(raw);

// Initialize Firebase ONCE
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ---------------- CONFIG ----------------
const restaurantId = "demo_restaurant_1";
const ownerId = "YiOdkITeq2laJg0Lx0QADe2pHw682"; // your UID

// ---------------- SEED FUNCTION ----------------
async function seed() {
  console.log("🚀 Seeding started...");

  // ---------------- RESTAURANT ----------------
  await db.collection("restaurants").doc(restaurantId).set({
    ownerId,
    name: "demo_restaurant",
    description: "Sample restaurant for testing dashboard",
    location: "Faisalabad",
    images: [],
    isDeleted: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ---------------- MENUS ----------------
  const menus = [
    { name: "Chicken Burger", category: "Fast Food", price: 450 },
    { name: "Zinger Burger", category: "Fast Food", price: 600 },
    { name: "Fries", category: "Sides", price: 200 },
  ];

  for (const item of menus) {
    await db.collection("menus").add({
      restaurantId,
      ownerId,
      ...item,
      description: "Tasty food item",
      isAvailable: true,
      isDeleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // ---------------- TABLES ----------------
  const tables = [
    { tableNumber: 1, capacity: 2 },
    { tableNumber: 2, capacity: 4 },
    { tableNumber: 3, capacity: 6 },
  ];

  for (const table of tables) {
    await db.collection("tables").add({
      restaurantId,
      ownerId,
      ...table,
      location: "Main Hall",
      status: "available",
      isDeleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // ---------------- STAFF ----------------
  const staff = [
    { name: "Ali", role: "Waiter" },
    { name: "Ahmed", role: "Chef" },
  ];

  for (const s of staff) {
    await db.collection("staff").add({
      restaurantId,
      ownerId,
      ...s,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  console.log("✅ Seeding completed successfully!");
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
});