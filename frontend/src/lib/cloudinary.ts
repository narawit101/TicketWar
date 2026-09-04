import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Extract public_id from a Cloudinary URL
 * Example: https://res.cloudinary.com/demo/image/upload/v12345/ticketwar/userprofile/user_1.jpg -> ticketwar/userprofile/user_1
 */
export function getPublicIdFromUrl(url: string | null | undefined): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Upload a profile image to Cloudinary in folder `ticketwar/userprofile`
 */
export async function uploadUserProfileImage(base64Data: string, userId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: "ticketwar/userprofile",
    public_id: `user_${userId}_${Date.now()}`,
    overwrite: true,
    resource_type: "image",
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });
  return result.secure_url;
}

/**
 * Upload a room poster to Cloudinary in folder `ticketwar/posters`
 */
export async function uploadRoomPoster(base64Data: string, roomIdPrefix?: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: "ticketwar/posters",
    public_id: `poster_${roomIdPrefix || "room"}_${Date.now()}`,
    overwrite: true,
    resource_type: "image",
    transformation: [
      { width: 1200, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });
  return result.secure_url;
}

/**
 * Upload a seating plan map to Cloudinary in folder `ticketwar/seating_plans`
 */
export async function uploadRoomSeatingPlan(base64Data: string, roomIdPrefix?: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: "ticketwar/seating_plans",
    public_id: `seating_${roomIdPrefix || "room"}_${Date.now()}`,
    overwrite: true,
    resource_type: "image",
    transformation: [
      { width: 1800, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });
  return result.secure_url;
}

// ponytail: separate folder for chat images (ticketwar/chat) vs files (ticketwar/files)
export async function uploadChatMessageImage(base64Data: string, roomId: string): Promise<string> {
  const isPdf = base64Data.startsWith("data:application/pdf");
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: isPdf ? "ticketwar/files" : "ticketwar/chat",
    public_id: `${isPdf ? "file" : "chat"}_${roomId}_${Date.now()}`,
    resource_type: isPdf ? "auto" : "image",
    ...(isPdf
      ? {}
      : {
          transformation: [
            { width: 1000, crop: "limit" },
            { quality: "auto", fetch_format: "auto" },
          ],
        }),
  });
  return result.secure_url;
}

/**
 * Delete an existing image from Cloudinary by its URL
 */
export async function deleteCloudinaryImage(url: string | null | undefined): Promise<boolean> {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return false;

  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === "ok";
  } catch (err) {
    console.error("[Cloudinary Delete Error]:", err);
    return false;
  }
}

export default cloudinary;
