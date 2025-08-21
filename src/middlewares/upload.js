import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Create uploads directory if it doesn't exist
const createUploadDirs = async () => {
  const dirs = [
    'uploads',
    'uploads/orders',
    'uploads/orders/graphics',
    'uploads/orders/finished',
    'uploads/orders/attachments'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// Initialize upload directories
createUploadDirs().catch(console.error);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'pixeda-volume/uploads/orders/';
    
    // Determine subdirectory based on field name
    if (file.fieldname.includes('graphicsImage')) {
      uploadPath += 'graphics/';
    } else if (file.fieldname.includes('finishedProductImage')) {
      uploadPath += 'finished/';
    } else if (file.fieldname.includes('attachments')) {
      uploadPath += 'attachments/';
    } else {
      uploadPath += 'general/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    
    // Include order info if available
    const orderId = req.params.id || req.body.orderId || 'new';
    const itemIndex = file.fieldname.match(/\[(\d+)\]/)?.[1] || '0';
    
    cb(null, `${orderId}-item${itemIndex}-${baseName}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 5MB limit
    files: 20 // Max 20 files per request
  }
});

// Middleware for order creation/update with multiple images
export const uploadOrderImages = upload.fields([
  { name: 'graphicsImages', maxCount: 10 },
  { name: 'finishedProductImages', maxCount: 10 },
  { name: 'attachments', maxCount: 10 }
]);

// Dynamic field names for items array
export const uploadOrderItemImages = (req, res, next) => {
  // Check if we have items in the request body to determine field names
  let items = [];
  
  try {
    // Try to parse items from body if it's a string
    if (typeof req.body.items === 'string') {
      items = JSON.parse(req.body.items);
    } else if (Array.isArray(req.body.items)) {
      items = req.body.items;
    }
  } catch (e) {
    // If parsing fails, continue without dynamic fields
  }

  // Generate dynamic field configurations
  const fields = [];
  
  // Add fields for each item
  items.forEach((item, index) => {
    fields.push(
      { name: `items[${index}][graphicsImage]`, maxCount: 1 },
      { name: `items[${index}][finishedProductImage]`, maxCount: 1 },
      { name: `items[${index}][attachments]`, maxCount: 5 }
    );
  });

  // Fallback static fields for when we can't determine items
  if (fields.length === 0) {
    for (let i = 0; i < 10; i++) {
      fields.push(
        { name: `items[${i}][graphicsImage]`, maxCount: 1 },
        { name: `items[${i}][finishedProductImage]`, maxCount: 1 },
        { name: `items[${i}][attachments]`, maxCount: 5 }
      );
    }
  }

  const dynamicUpload = upload.fields(fields);
  dynamicUpload(req, res, next);
};

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files uploaded.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field.' });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only image files are allowed.' });
  }
  
  next(error);
};

export default upload;
