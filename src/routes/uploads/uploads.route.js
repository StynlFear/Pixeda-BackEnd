import { Router } from "express";
import path from "path";
import { promises as fs } from "fs";

const router = Router();

// Serve uploaded files
router.get("/*", async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'uploads', req.params[0]);
    
    // Check if file exists
    await fs.access(filePath);
    
    // Security check - ensure path is within uploads directory
    const normalizedPath = path.normalize(filePath);
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!normalizedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Send the file
    res.sendFile(normalizedPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: "File not found" });
    }
    res.status(500).json({ error: "Error serving file" });
  }
});

export default router;
