import { validationResult } from "express-validator";
import Order from "../../models/order/order.model.js";
import { mergeFilesWithBody, deleteUploadedFiles, getFileUrl } from "../../utils/fileUtils.js";

const bailIfInvalid = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

// Helper function to add file URLs to order items
const addFileUrlsToOrder = (order) => {
  if (order.items) {
    order.items.forEach(item => {
      if (item.graphicsImage) {
        item.graphicsImageUrl = getFileUrl(item.graphicsImage);
      }
      if (item.finishedProductImage) {
        item.finishedProductImageUrl = getFileUrl(item.finishedProductImage);
      }
      if (item.attachments && Array.isArray(item.attachments)) {
        item.attachmentUrls = item.attachments.map(path => getFileUrl(path));
      }
    });
  }
  return order;
};

export const listOrders = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 100);
    const sort = req.query.sort ?? "-createdAt";
    const search = (req.query.search ?? "").trim();
    const status = req.query.status;
    const priority = req.query.priority;
    const customer = req.query.customer;

    let q = {};

    // Text search
    if (search) {
      q.$text = { $search: search };
    }

    // Status filter
    if (status) {
      q.status = status;
    }

    // Priority filter
    if (priority) {
      q.priority = priority;
    }

    // Customer filter
    if (customer) {
      q.customer = customer;
    }

    const [items, total] = await Promise.all([
      Order.find(q)
        .populate('customer', 'firstName lastName email phone')
        .populate('customerCompany', 'name cui')
        .populate('items.product', 'productName price')
        .populate('items.assignments.assignedTo', 'firstName lastName')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(q),
    ]);

    // Add file URLs to each order
    const itemsWithUrls = items.map(order => addFileUrlsToOrder(order));

    res.json({ total, page, limit, sort, items: itemsWithUrls });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getOrder = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const doc = await Order.findById(req.params.id)
      .populate('customer')
      .populate('customerCompany')
      .populate('items.product')
      .populate('items.assignments.assignedTo', 'firstName lastName email')
      .lean();
    
    if (!doc) return res.status(404).json({ error: "Order not found" });
    
    // Add file URLs to the order
    const orderWithUrls = addFileUrlsToOrder(doc);
    
    res.json(orderWithUrls);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createOrder = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    // Merge uploaded files with request body
    const orderData = mergeFilesWithBody(req.body, req.files);
    
    // Parse items if it's a string (happens with multipart/form-data)
    if (typeof orderData.items === 'string') {
      try {
        orderData.items = JSON.parse(orderData.items);
      } catch (e) {
        await deleteUploadedFiles(req.files);
        return res.status(400).json({ error: "Invalid items data format" });
      }
    }

    // Calculate the initial order status based on item statuses
    if (orderData.items) {
      const initialOrderStatus = calculateOrderStatus(orderData.items);
      orderData.status = initialOrderStatus;
    }

    const doc = await Order.create(orderData);
    
    // Populate the created order before returning
    const populatedDoc = await Order.findById(doc._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('customerCompany', 'name cui')
      .populate('items.product', 'productName price')
      .populate('items.assignments.assignedTo', 'firstName lastName')
      .lean();

    // Convert file paths to URLs for response
    if (populatedDoc.items) {
      populatedDoc.items.forEach(item => {
        if (item.graphicsImage) {
          item.graphicsImageUrl = getFileUrl(item.graphicsImage);
        }
        if (item.finishedProductImage) {
          item.finishedProductImageUrl = getFileUrl(item.finishedProductImage);
        }
        if (item.attachments && Array.isArray(item.attachments)) {
          item.attachmentUrls = item.attachments.map(path => getFileUrl(path));
        }
      });
    }

    res.status(201).json(populatedDoc);
  } catch (e) {
    // Clean up uploaded files on error
    await deleteUploadedFiles(req.files);
    
    if (e?.code === 11000) {
      return res.status(400).json({ error: "Duplicate key", details: e.keyValue });
    }
    res.status(500).json({ error: e.message });
  }
};

export const updateOrder = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    // Merge uploaded files with request body
    const orderData = mergeFilesWithBody(req.body, req.files);
    
    // Parse items if it's a string (happens with multipart/form-data)
    if (typeof orderData.items === 'string') {
      try {
        orderData.items = JSON.parse(orderData.items);
      } catch (e) {
        await deleteUploadedFiles(req.files);
        return res.status(400).json({ error: "Invalid items data format" });
      }
    }

    // If items are being updated, calculate the new order status
    if (orderData.items) {
      const newOrderStatus = calculateOrderStatus(orderData.items);
      orderData.status = newOrderStatus;
    }

    const doc = await Order.findByIdAndUpdate(req.params.id, orderData, {
      new: true,
      runValidators: true,
    })
      .populate('customer', 'firstName lastName email phone')
      .populate('customerCompany', 'name cui')
      .populate('items.product', 'productName price')
      .populate('items.assignments.assignedTo', 'firstName lastName')
      .lean();

    if (!doc) {
      await deleteUploadedFiles(req.files);
      return res.status(404).json({ error: "Order not found" });
    }

    // Convert file paths to URLs for response
    if (doc.items) {
      doc.items.forEach(item => {
        if (item.graphicsImage) {
          item.graphicsImageUrl = getFileUrl(item.graphicsImage);
        }
        if (item.finishedProductImage) {
          item.finishedProductImageUrl = getFileUrl(item.finishedProductImage);
        }
        if (item.attachments && Array.isArray(item.attachments)) {
          item.attachmentUrls = item.attachments.map(path => getFileUrl(path));
        }
      });
    }

    res.json(doc);
  } catch (e) {
    // Clean up uploaded files on error
    await deleteUploadedFiles(req.files);
    
    if (e?.code === 11000) {
      return res.status(400).json({ error: "Duplicate key", details: e.keyValue });
    }
    res.status(500).json({ error: e.message });
  }
};

export const deleteOrder = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const doc = await Order.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Additional endpoints for order management
export const updateOrderStatus = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const { status } = req.body;
    const now = new Date();
    
    // Find the order first to check current status and handle assignments
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    const oldStatus = order.status;
    
    // If changing to DONE, complete all active assignments
    if (status === "DONE" && oldStatus !== "DONE") {
      order.items.forEach(item => {
        // Set all items to DONE if not already
        if (item.itemStatus !== "DONE") {
          item.itemStatus = "DONE";
        }
        
        // Complete all active assignments
        item.assignments.forEach(assignment => {
          if (assignment.isActive) {
            assignment.completedAt = now;
            assignment.isActive = false;
            
            // Calculate time spent
            if (assignment.startedAt) {
              assignment.timeSpent = now - assignment.startedAt;
            } else if (assignment.assignedAt) {
              assignment.timeSpent = now - assignment.assignedAt;
            }
          }
        });
      });
    }
    
    // Update the order status
    order.status = status;
    
    // Save the order
    await order.save();
    
    // Populate and return the updated document
    const doc = await Order.findById(order._id)
      .populate('customer', 'firstName lastName')
      .populate('items.assignments.assignedTo', 'firstName lastName')
      .lean();

    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Helper function to determine order status based on item statuses
const calculateOrderStatus = (items) => {
  if (!items || items.length === 0) return "TO_DO";
  
  const itemStatuses = items.map(item => item.itemStatus);
  
  // If all items are done, order is ready to be taken
  if (itemStatuses.every(status => status === "DONE")) {
    return "READY_TO_BE_TAKEN";
  }
  
  // If any item has moved from TO_DO to any other status, order is in progress
  if (itemStatuses.some(status => status !== "TO_DO" && status !== "CANCELLED")) {
    return "IN_PROGRESS";
  }
  
  // If all items are TO_DO or CANCELLED, order remains TO_DO
  return "TO_DO";
};

export const updateItemStatus = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const { itemId } = req.params;
    const { itemStatus } = req.body;
    const currentUserId = req.user?.sub || null;
    const asObjectId = currentUserId ? new mongoose.Types.ObjectId(currentUserId) : null;
    const now = new Date();

    const order = await Order.findOne({ _id: req.params.id, "items._id": itemId });
    if (!order) return res.status(404).json({ error: "Order or item not found" });

    const item = order.items.id(itemId);
    const oldStatus = item.itemStatus;

    // Helper: close active assignments (optionally only for a given stage)
    const closeActiveAssignments = (stageToClose = null) => {
      item.assignments.forEach(a => {
        if (a.isActive && (stageToClose == null || a.stage === stageToClose)) {
          a.completedAt = now;
          a.isActive = false;
          if (a.startedAt) a.timeSpent = now - a.startedAt;
          else if (a.assignedAt) a.timeSpent = now - a.assignedAt;
        }
      });
    };

    if (oldStatus !== itemStatus) {
      // Always close the stage you're leaving (including TO_DO)
      if (oldStatus) {
        closeActiveAssignments(oldStatus);
      }

      if (itemStatus === "DONE") {
        // Moving to DONE: make sure nothing remains active
        closeActiveAssignments(null);
      } else if (itemStatus !== "TO_DO") {
        // Reuse latest assignment for this stage (ignore assignedTo to avoid duplicates)
        let stageRecord = item.assignments
          .filter(a => a.stage === itemStatus)
          .sort((a, b) => (b.assignedAt?.getTime() || 0) - (a.assignedAt?.getTime() || 0))[0];

        if (!stageRecord) {
          // Create new if none exists yet
          stageRecord = {
            stage: itemStatus,
            assignedTo: asObjectId || null,
            assignedAt: now,
            startedAt: now,
            isActive: true,
          };
          item.assignments.push(stageRecord);
        } else {
          // Reactivate and update existing stage record
          stageRecord.isActive = true;
          stageRecord.startedAt = now;
          stageRecord.completedAt = null;
          // If a user is known, set/overwrite assignedTo to avoid null duplicates
          if (asObjectId) stageRecord.assignedTo = asObjectId;
        }

        // Safety: ensure only one active assignment overall
        let firstActiveSeen = false;
        item.assignments.forEach(a => {
          if (a.isActive) {
            if (!firstActiveSeen) firstActiveSeen = true;
            else {
              // Close stray actives (shouldn't happen, but protects against double calls)
              a.completedAt = now;
              a.isActive = false;
              if (a.startedAt) a.timeSpent = now - a.startedAt;
              else if (a.assignedAt) a.timeSpent = now - a.assignedAt;
            }
          }
        });
      } else {
        // Back to TO_DO: ensure nothing remains active
        closeActiveAssignments(null);
      }
    }

    // Update item + order statuses
    item.itemStatus = itemStatus;
    const newOrderStatus = calculateOrderStatus(order.items);
    if (order.status !== newOrderStatus) order.status = newOrderStatus;

    order.markModified("items");
    await order.save();

    const populatedDoc = await Order.findById(order._id)
      .populate("customer", "firstName lastName")
      .populate("items.assignments.assignedTo", "firstName lastName")
      .lean();

    res.json(populatedDoc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
