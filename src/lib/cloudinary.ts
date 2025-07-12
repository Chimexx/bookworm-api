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

export async function uploadToCloudinary (filePath: string): Promise<string> {
  const handleUnlink = () => {
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr)
        console.error(
          "Error deleting local temp file after Cloudinary upload:",
          unlinkErr
        );
    }); 
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'book_covers', 
      resource_type: 'auto',
    });

    // After successful upload to Cloudinary, delete the local temporary file
   handleUnlink();

    return result.secure_url; 
  } catch (error) {
    if (fs.existsSync(filePath)) {
      handleUnlink();
    }
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to cloud storage.');
  }
}