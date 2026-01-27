import cloudinary from "cloudinary";

// Note: Cloudinary is configured in upload.middleware.js
// This file provides utility functions for Cloudinary operations

// Delete file from Cloudinary
export const deleteCloudinaryFile = async (publicId) => {
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
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
  
  return cloudinary.v2.url(publicId, defaultOptions);
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (url) => {
  if (!url) return null;
  
  // Extract public ID from Cloudinary URL
  // Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
  const match = url.match(/\/upload\/[^\/]+\/(.+)$/);
  return match ? match[1].replace(/\.[^/.]+$/, "") : null;
};

export default cloudinary.v2;
