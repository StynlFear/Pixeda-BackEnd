import path from "path";
import { promises as fs } from "fs";

/**
 * Process uploaded files and return file paths
 */
export const processUploadedFiles = (files) => {
  const processedFiles = {};
  
  if (!files) return processedFiles;
  
  // Process each field
  Object.keys(files).forEach(fieldName => {
    const fileArray = files[fieldName];
    
    if (fieldName.includes('[') && fieldName.includes(']')) {
      // Handle array fields like items[0][graphicsImage]
      const matches = fieldName.match(/(\w+)\[(\d+)\]\[(\w+)\]/);
      if (matches) {
        const [, arrayName, index, propertyName] = matches;
        
        if (!processedFiles[arrayName]) {
          processedFiles[arrayName] = [];
        }
        
        if (!processedFiles[arrayName][index]) {
          processedFiles[arrayName][index] = {};
        }
        
        if (propertyName === 'attachments' && fileArray.length > 1) {
          processedFiles[arrayName][index][propertyName] = fileArray.map(file => file.path);
        } else {
          processedFiles[arrayName][index][propertyName] = fileArray[0]?.path || null;
        }
      }
    } else {
      // Handle simple fields
      if (fileArray.length > 1) {
        processedFiles[fieldName] = fileArray.map(file => file.path);
      } else {
        processedFiles[fieldName] = fileArray[0]?.path || null;
      }
    }
  });
  
  return processedFiles;
};

/**
 * Merge uploaded files with request body
 */
export const mergeFilesWithBody = (body, uploadedFiles) => {
  const processed = processUploadedFiles(uploadedFiles);
  
  // Deep merge the processed files with the body
  const result = { ...body };
  
  Object.keys(processed).forEach(key => {
    if (key === 'items' && Array.isArray(result.items)) {
      // Merge file data into items array
      result.items.forEach((item, index) => {
        if (processed.items && processed.items[index]) {
          Object.assign(item, processed.items[index]);
        }
      });
    } else {
      result[key] = processed[key];
    }
  });
  
  return result;
};

/**
 * Delete uploaded files (for cleanup on error)
 */
export const deleteUploadedFiles = async (files) => {
  if (!files) return;
  
  const deletePromises = [];
  
  Object.values(files).forEach(fileArray => {
    fileArray.forEach(file => {
      deletePromises.push(
        fs.unlink(file.path).catch(() => {
          // Ignore errors when deleting files
        })
      );
    });
  });
  
  await Promise.all(deletePromises);
};

/**
 * Get file URL for serving
 */
export const getFileUrl = (filePath, baseUrl = '/api/uploads') => {
  if (!filePath) return null;
  
  // Remove 'uploads/' prefix if present
  const cleanPath = filePath.replace(/^uploads\//, '');
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Validate image file
 */
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }
  
  return true;
};
