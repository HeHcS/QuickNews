import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensures that the profiles directory exists for storing profile pictures
 */
export const ensureProfilesDirExists = () => {
  const profilesDir = path.join(__dirname, '../uploads/profiles');
  
  if (!fs.existsSync(profilesDir)) {
    console.log('Creating profiles upload directory...');
    fs.mkdirSync(profilesDir, { recursive: true });
  }
  
  // Create default profile image if it doesn't exist
  const defaultProfilePath = path.join(profilesDir, 'default-profile.png');
  
  if (!fs.existsSync(defaultProfilePath)) {
    try {
      // Copy a default profile image if available, or create an empty file
      const defaultSourcePath = path.join(__dirname, '../assets/default-profile.png');
      
      if (fs.existsSync(defaultSourcePath)) {
        fs.copyFileSync(defaultSourcePath, defaultProfilePath);
      } else {
        // If no default image, create an empty file (this is a placeholder and should be replaced)
        fs.writeFileSync(defaultProfilePath, '');
        console.log('Warning: Created empty default profile picture. Please replace with an actual image.');
      }
    } catch (error) {
      console.error('Error creating default profile picture:', error);
    }
  }
  
  return profilesDir;
}; 