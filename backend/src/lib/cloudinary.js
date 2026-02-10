import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Delete file from Cloudinary
export const deleteCloudinaryFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
};

// Get optimized URL for images
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: "auto",
    fetch_format: "auto",
    ...options,
  };

  return cloudinary.url(publicId, defaultOptions);
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (url) => {
  if (!url) return null;
  const match = url.match(/\/upload\/[^\/]+\/(.+)$/);
  return match ? match[1].replace(/\.[^/.]+$/, "") : null;
};

export default cloudinary;
