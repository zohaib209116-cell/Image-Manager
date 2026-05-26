export const RENDER_BASE_URL = "https://server-1py2.onrender.com";

export async function uploadRestaurantImage(file: File, token: string): Promise<{ imageUrl: string; publicId: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${RENDER_BASE_URL}/storage/upload/restaurant`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload restaurant image");
  return res.json();
}

export async function uploadMenuImage(file: File, token: string): Promise<{ imageUrl: string; publicId: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${RENDER_BASE_URL}/storage/upload/menu`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload menu image");
  return res.json();
}

export async function uploadMultipleImages(files: File[], token: string): Promise<{ imageUrl: string; publicId: string }[]> {
  const formData = new FormData();
  files.forEach(file => formData.append("image", file));

  const res = await fetch(`${RENDER_BASE_URL}/storage/upload/multiple`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload images");
  return res.json();
}
