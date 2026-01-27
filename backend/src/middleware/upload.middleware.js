import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary";

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn("⚠️ Cloudinary credentials not found. File uploads will not work.");
  console.warn("Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file");
}

// Use memory storage first, then manually upload to Cloudinary
const storage = multer.memoryStorage();

// File filter function - allow all file types
const fileFilter = (req, file, cb) => {
  console.log('🔍 Upload middleware - fileFilter called with:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    fieldname: file.fieldname,
    buffer: file.buffer ? 'Buffer exists' : 'No buffer',
    stream: file.stream ? 'Stream exists' : 'No stream'
  });
  
  // Check if file size is valid
  if (!file.size || file.size === 0) {
    console.error('❌ File size is invalid:', file.size);
    return cb(new Error('Invalid file size'), false);
  }
  
  // Allow all file types
  cb(null, true);
};

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  // Add error handling for multer
  onError: (error, next) => {
    console.error('❌ Multer error:', error);
    next(error);
  }
});

export default upload;
