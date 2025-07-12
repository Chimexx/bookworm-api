import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
import fs from 'fs';

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud_name || !api_key || !api_secret) {
  throw new Error("Missing Cloudinary configuration");
}

cloudinary.config({
  cloud_name,
  api_key,
  api_secret
});

export default cloudinary;

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
  secure: true
});

export async function uploadToCloudinary(filePath: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'book_covers', // Optional: Organize uploads in a specific folder in your Cloudinary account
      resource_type: 'auto', // Automatically detect file type (image, video, raw)
      // Add more options as needed, e.g., transformations, public_id, tags
    });

    // After successful upload to Cloudinary, delete the local temporary file
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting local temp file after Cloudinary upload:', unlinkErr);
    });

    return result.secure_url; // Return the secure URL from Cloudinary
  } catch (error) {
    // If Cloudinary upload fails, ensure the local temporary file is also deleted
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting local temp file after Cloudinary failure:', unlinkErr);
      });
    }
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to cloud storage.');
  }
}