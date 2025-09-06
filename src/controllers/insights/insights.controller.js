import { validationResult } from "express-validator";
import mongoose from "mongoose";
import Order from "../../models/order/order.model.js";
import { Employee } from "../../models/employee/employee.model.js";
import Client from "../../models/client/client.model.js";
import { Product } from "../../models/product/product.model.js";
import Insights from "../../models/insights/insights.model.js";

const bailIfInvalid = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

// Helper function to parse date range from query
const parseDateRange = (req) => {
  const { startDate, endDate, period = "30d" } = req.query;
  
  let start, end;
  
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    end = new Date();
    switch (period) {
      case "7d":
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
  }
  
  return { start, end };
};

// Helper function to format time from milliseconds to readable format
const formatTime = (milliseconds) => {
  if (!milliseconds || milliseconds === 0) return null;
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    milliseconds,
    seconds,
    minutes,
    hours,
    days,
    formatted: {
      seconds: `${seconds}s`,
      minutes: `${minutes}m ${seconds % 60}s`,
      hours: `${hours}h ${minutes % 60}m ${seconds % 60}s`,
      human: days > 0 ? `${days}d ${hours % 24}h ${minutes % 60}m` : 
             hours > 0 ? `${hours}h ${minutes % 60}m` :
             minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
    }
  };
};

// ORDER & WORKFLOW INSIGHTS
export const getOrderInsights = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const { start, end } = parseDateRange(req);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Overdue orders
    const overdueOrders = await Order.find({
      dueDate: { $lt: new Date() },
      status: { $nin: ["DONE", "CANCELLED"] },
      createdAt: { $gte: start, $lte: end }
    }).populate("customer", "firstName lastName").lean();

    // Orders by priority
    const ordersByPriority = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Average completion time
    const completedOrders = await Order.aggregate([
      {
        $match: {
          status: "DONE",
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $addFields: {
          completionTime: { $subtract: ["$updatedAt", "$createdAt"] }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletionTime: { $avg: "$completionTime" },
          totalCompleted: { $sum: 1 }
        }
      }
    ]);

    // Bottlenecks per stage (items stuck in each stage)
    const stageBottlenecks = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      { $unwind: "$items.assignments" },
      {
        $group: {
          _id: {
            stage: "$items.assignments.stage",
            isActive: "$items.assignments.isActive",
            isCompleted: {
              $cond: [
                { $ne: ["$items.assignments.completedAt", null] },
                true,
                false
              ]
            }
          },
          count: { $sum: 1 },
          avgTimeInStage: {
            $avg: {
              $cond: [
                { $eq: ["$items.assignments.isActive", true] },
                { $subtract: [new Date(), "$items.assignments.startedAt"] },
                "$items.assignments.timeSpent"
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: "$_id.stage",
          activeAssignments: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$_id.isActive", true] }, { $eq: ["$_id.isCompleted", false] }] },
                "$count",
                0
              ]
            }
          },
          completedAssignments: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$_id.isActive", false] }, { $eq: ["$_id.isCompleted", true] }] },
                "$count",
                0
              ]
            }
          },
          avgTimeInStageActive: {
            $avg: {
              $cond: [
                { $and: [{ $eq: ["$_id.isActive", true] }, { $eq: ["$_id.isCompleted", false] }] },
                "$avgTimeInStage",
                null
              ]
            }
          },
          avgTimeInStageCompleted: {
            $avg: {
              $cond: [
                { $and: [{ $eq: ["$_id.isActive", false] }, { $eq: ["$_id.isCompleted", true] }] },
                "$avgTimeInStage",
                null
              ]
            }
          }
        }
      },
      { $sort: { activeAssignments: -1, completedAssignments: -1 } }
    ]);

    // Assignment overview per stage
    const assignmentOverview = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      { $unwind: "$items.assignments" },
      {
        $lookup: {
          from: "employees",
          localField: "items.assignments.assignedTo",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: {
            stage: "$items.assignments.stage",
            employeeId: "$employee._id",
            employeeName: { $concat: ["$employee.firstName", " ", "$employee.lastName"] }
          },
          itemCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.stage",
          assignments: {
            $push: {
              employeeId: "$_id.employeeId",
              employeeName: "$_id.employeeName",
              itemCount: "$itemCount"
            }
          },
          totalItems: { $sum: "$itemCount" }
        }
      }
    ]);

    // Format time values for better readability
    const formattedStageBottlenecks = stageBottlenecks.map(stage => ({
      ...stage,
      avgTimeInStageActiveFormatted: formatTime(stage.avgTimeInStageActive),
      avgTimeInStageCompletedFormatted: formatTime(stage.avgTimeInStageCompleted)
    }));

    const formattedAverageCompletionTime = completedOrders[0] ? {
      ...completedOrders[0],
      avgCompletionTimeFormatted: formatTime(completedOrders[0].avgCompletionTime)
    } : { avgCompletionTime: 0, totalCompleted: 0, avgCompletionTimeFormatted: null };

    res.json({
      success: true,
      data: {
        period: { start, end },
        ordersByStatus,
        overdueOrders,
        ordersByPriority,
        averageCompletionTime: formattedAverageCompletionTime,
        stageBottlenecks: formattedStageBottlenecks,
        assignmentOverview
      }
    });
  } catch (error) {
    console.error("Error getting order insights:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve order insights",
      error: error.message 
    });
  }
};

// EMPLOYEE INSIGHTS
export const getEmployeeInsights = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const { start, end } = parseDateRange(req);

    // Workload distribution (including active assignment tracking)
    const workloadDistribution = await Order.aggregate([
  { $match: { createdAt: { $gte: start, $lte: end } } },
  { $unwind: "$items" },
  { $unwind: "$items.assignments" },
  {
    $lookup: {
      from: "employees",
      localField: "items.assignments.assignedTo",
      foreignField: "_id",
      as: "employee"
    }
  },
  { $unwind: "$employee" },
  {
    $group: {
      _id: {
        employeeId: "$employee._id",
        employeeName: { $concat: ["$employee.firstName", " ", "$employee.lastName"] },
        position: "$employee.position"
      },
      totalAssignments: { $sum: 1 },
      activeAssignments: {
        $sum: {
          $cond: [
            {
              $and: [
                { $eq: ["$items.assignments.isActive", true] },
                {
                  $or: [
                    { $eq: ["$items.assignments.completedAt", null] },
                    { $eq: [{ $type: "$items.assignments.completedAt" }, "null"] }
                  ]
                }
              ]
            },
            1,
            0
          ]
        }
      },
      completedAssignments: {
        $sum: {
          $cond: [
            {
              $and: [
                { $eq: ["$items.assignments.isActive", false] },
                { $ne: ["$items.assignments.completedAt", null] },
                { $eq: [{ $type: "$items.assignments.completedAt" }, "date"] }
              ]
            },
            1,
            0
          ]
        }
      },
      totalTimeSpent: {
        $sum: {
          $cond: [
            {
              $and: [
                { $eq: ["$items.assignments.isActive", false] },
                { $ne: ["$items.assignments.timeSpent", null] },
                { $in: [{ $type: "$items.assignments.timeSpent" }, ["double", "int", "long"]] }
              ]
            },
            "$items.assignments.timeSpent",
            0
          ]
        }
      },
      currentWorkTime: {
        $sum: {
          $cond: [
            {
              $and: [
                { $eq: ["$items.assignments.isActive", true] },
                { $ne: ["$items.assignments.startedAt", null] },
                { $eq: [{ $type: "$items.assignments.startedAt" }, "date"] },
                {
                  $or: [
                    { $eq: ["$items.assignments.completedAt", null] },
                    { $eq: [{ $type: "$items.assignments.completedAt" }, "null"] }
                  ]
                }
              ]
            },
            { $subtract: [new Date(), "$items.assignments.startedAt"] },
            0
          ]
        }
      }
    }
  },
  {
    $addFields: {
      completionRate: {
        $cond: [
          { $eq: ["$totalAssignments", 0] },
          0,
          { $multiply: [{ $divide: ["$completedAssignments", "$totalAssignments"] }, 100] }
        ]
      },
      avgTimePerAssignment: {
        $cond: [
          { $eq: ["$completedAssignments", 0] },
          0,
          { $divide: ["$totalTimeSpent", "$completedAssignments"] }
        ]
      }
    }
  },
  { $sort: { totalAssignments: -1 } }
]);

    // Average turnaround time per employee (time from assignment to completion)
    const employeeTurnaroundTime = await Order.aggregate([
  { $match: { createdAt: { $gte: start, $lte: end } } },
  { $unwind: "$items" },
  { $unwind: "$items.assignments" },
  {
    $lookup: {
      from: "employees",
      localField: "items.assignments.assignedTo",
      foreignField: "_id",
      as: "employee"
    }
  },
  { $unwind: "$employee" },
  {
    $addFields: {
      assignmentDuration: {
        $cond: [
          {
            $and: [
              { $eq: ["$items.assignments.isActive", false] },
              { $ne: ["$items.assignments.completedAt", null] },
              { $eq: [{ $type: "$items.assignments.completedAt" }, "date"] }
            ]
          },
          { $subtract: ["$items.assignments.completedAt", "$items.assignments.assignedAt"] },
          null
        ]
      },
      currentAssignmentAge: {
        $cond: [
          {
            $and: [
              { $eq: ["$items.assignments.isActive", true] },
              {
                $or: [
                  { $eq: ["$items.assignments.completedAt", null] },
                  { $eq: [{ $type: "$items.assignments.completedAt" }, "null"] }
                ]
              }
            ]
          },
          { $subtract: [new Date(), "$items.assignments.assignedAt"] },
          null
        ]
      }
    }
  },
  {
    $group: {
      _id: {
        employeeId: "$employee._id",
        employeeName: { $concat: ["$employee.firstName", " ", "$employee.lastName"] },
        stage: "$items.assignments.stage"
      },
      completedAssignments: { $sum: { $cond: [{ $ne: ["$assignmentDuration", null] }, 1, 0] } },
      activeAssignments: { $sum: { $cond: [{ $ne: ["$currentAssignmentAge", null] }, 1, 0] } },
      avgCompletionTime: { $avg: { $cond: [{ $ne: ["$assignmentDuration", null] }, "$assignmentDuration", null] } },
      avgCurrentAssignmentAge: { $avg: { $cond: [{ $ne: ["$currentAssignmentAge", null] }, "$currentAssignmentAge", null] } },
      totalCompletionTime: { $sum: { $cond: [{ $ne: ["$assignmentDuration", null] }, "$assignmentDuration", 0] } },
      minCompletionTime: { $min: { $cond: [{ $ne: ["$assignmentDuration", null] }, "$assignmentDuration", null] } },
      maxCompletionTime: { $max: { $cond: [{ $ne: ["$assignmentDuration", null] }, "$assignmentDuration", null] } }
    }
  },
  {
    $group: {
      _id: {
        employeeId: "$_id.employeeId",
        employeeName: "$_id.employeeName"
      },
      stagePerformance: {
        $push: {
          stage: "$_id.stage",
          completedAssignments: "$completedAssignments",
          activeAssignments: "$activeAssignments",
          avgCompletionTime: "$avgCompletionTime",
          avgCurrentAssignmentAge: "$avgCurrentAssignmentAge",
          totalCompletionTime: "$totalCompletionTime",
          minCompletionTime: "$minCompletionTime",
          maxCompletionTime: "$maxCompletionTime"
        }
      },
      overallAvgCompletionTime: { $avg: "$avgCompletionTime" },
      totalCompletedAssignments: { $sum: "$completedAssignments" },
      totalActiveAssignments: { $sum: "$activeAssignments" },
      totalWorkTime: { $sum: "$totalCompletionTime" }
    }
  },
  { $sort: { overallAvgCompletionTime: 1 } }
]);

    // Active vs inactive employees
    const allEmployees = await Employee.find({}, { password: 0 }).lean();
    const activeEmployeeIds = await Order.distinct("items.assignments.assignedTo", {
      createdAt: { $gte: start, $lte: end }
    });

    const employeeActivity = allEmployees.map(emp => ({
      ...emp,
      isActive: activeEmployeeIds.some(id => String(id) === String(emp._id)),
      lastActivity: null // Would need session tracking for real last activity
    }));

    // Format time values for better readability
    const formattedWorkloadDistribution = workloadDistribution.map(emp => ({
      ...emp,
      totalTimeSpentFormatted: formatTime(emp.totalTimeSpent),
      avgTimePerAssignmentFormatted: formatTime(emp.avgTimePerAssignment),
      currentWorkTimeFormatted: formatTime(emp.currentWorkTime)
    }));

    const formattedEmployeeTurnaroundTime = employeeTurnaroundTime.map(emp => ({
      ...emp,
      overallAvgCompletionTimeFormatted: formatTime(emp.overallAvgCompletionTime),
      totalWorkTimeFormatted: formatTime(emp.totalWorkTime),
      stagePerformance: emp.stagePerformance.map(stage => ({
        ...stage,
        avgCompletionTimeFormatted: formatTime(stage.avgCompletionTime),
        avgCurrentAssignmentAgeFormatted: formatTime(stage.avgCurrentAssignmentAge),
        totalCompletionTimeFormatted: formatTime(stage.totalCompletionTime),
        minCompletionTimeFormatted: formatTime(stage.minCompletionTime),
        maxCompletionTimeFormatted: formatTime(stage.maxCompletionTime)
      }))
    }));

    res.json({
      success: true,
      data: {
        period: { start, end },
        workloadDistribution: formattedWorkloadDistribution,
        employeeTurnaroundTime: formattedEmployeeTurnaroundTime,
        employeeActivity,
        summary: {
          totalEmployees: allEmployees.length,
          activeEmployees: activeEmployeeIds.length,
          inactiveEmployees: allEmployees.length - activeEmployeeIds.length
        }
      }
    });
  } catch (error) {
    console.error("Error getting employee insights:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve employee insights",
      error: error.message 
    });
  }
};

// CLIENT INSIGHTS
export const getClientInsights = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const { start, end } = parseDateRange(req);

    // Top clients by number of orders
    const topClientsByOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $lookup: {
          from: "clients",
          localField: "customer",
          foreignField: "_id",
          as: "client"
        }
      },
      { $unwind: "$client" },
      {
        $group: {
          _id: {
            clientId: "$client._id",
            clientName: { $concat: ["$client.firstName", " ", "$client.lastName"] }
          },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: { $sum: "$items.priceSnapshot" } },
          avgOrderValue: { $avg: { $sum: "$items.priceSnapshot" } },
          lastOrderDate: { $max: "$createdAt" }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 20 }
    ]);

    // New vs returning clients
    const clientAnalysis = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$customer",
          firstOrder: { $min: "$createdAt" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          isNewClient: { $gte: ["$firstOrder", start] }
        }
      },
      {
        $group: {
          _id: null,
          newClients: { $sum: { $cond: ["$isNewClient", 1, 0] } },
          returningClients: { $sum: { $cond: ["$isNewClient", 0, 1] } },
          totalClients: { $sum: 1 }
        }
      }
    ]);

    // At-risk clients (orders with issues)
    const atRiskClients = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          $or: [
            { status: "CANCELLED" },
            { dueDate: { $lt: new Date() }, status: { $ne: "DONE" } }
          ]
        }
      },
      {
        $lookup: {
          from: "clients",
          localField: "customer",
          foreignField: "_id",
          as: "client"
        }
      },
      { $unwind: "$client" },
      {
        $group: {
          _id: {
            clientId: "$client._id",
            clientName: { $concat: ["$client.firstName", " ", "$client.lastName"] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] }
          },
          overdueOrders: {
            $sum: { $cond: [{ $and: [{ $lt: ["$dueDate", new Date()] }, { $ne: ["$status", "DONE"] }] }, 1, 0] }
          },
          totalProblematicOrders: { $sum: 1 }
        }
      },
      { $match: { totalProblematicOrders: { $gte: 1 } } },
      { $sort: { totalProblematicOrders: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        period: { start, end },
        topClientsByOrders,
        clientAnalysis: clientAnalysis[0] || { newClients: 0, returningClients: 0, totalClients: 0 },
        atRiskClients
      }
    });
  } catch (error) {
    console.error("Error getting client insights:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve client insights",
      error: error.message 
    });
  }
};

// PRODUCT INSIGHTS
export const getProductInsights = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const { start, end } = parseDateRange(req);

    // Most ordered product types
    const productTypeStats = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            productType: "$product.type",
            productName: "$product.productName"
          },
          orderCount: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } },
          avgPrice: { $avg: "$items.priceSnapshot" },
          uniqueOrders: { $addToSet: "$_id" }
        }
      },
      {
        $addFields: {
          uniqueOrderCount: { $size: "$uniqueOrders" }
        }
      },
      { $sort: { orderCount: -1 } }
    ]);

    // Revenue contribution per product type
    const revenueByProductType = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$product.type",
          totalRevenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } },
          orderCount: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Products rarely ordered
    const allProducts = await Product.find().lean();
    const orderedProductIds = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.product", orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $lte: 2 } } } // Rarely ordered = 2 or fewer orders
    ]);

    // Build a Set of ordered product ids for fast, safe membership checks
    const orderedProductIdSet = new Set(orderedProductIds.map(op => op._id ? String(op._id) : null).filter(Boolean));

    // Rarely ordered products are those present in allProducts where their id appears in orderedProductIdSet
    // (ordered <= 2). If orderedProductIdSet is empty, treat all products as rarely ordered.
    const rarelyOrderedProducts = allProducts.filter(product => {
      const pid = String(product._id);
      if (orderedProductIdSet.size === 0) return true;
      return orderedProductIdSet.has(pid);
    });

    res.json({
      success: true,
      data: {
        period: { start, end },
        productTypeStats,
        revenueByProductType,
        rarelyOrderedProducts,
        summary: {
          totalProducts: allProducts.length,
          activeProducts: productTypeStats.length,
          rarelyOrderedCount: rarelyOrderedProducts.length
        }
      }
    });
  } catch (error) {
    console.error("Error getting product insights:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve product insights",
      error: error.message 
    });
  }
};

// FINANCIAL INSIGHTS
export const getFinancialInsights = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const { start, end } = parseDateRange(req);

    // Total revenue in selected period
    const totalRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: "CANCELLED" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } },
          totalOrders: { $addToSet: "$_id" },
          totalItems: { $sum: "$items.quantity" }
        }
      },
      {
        $addFields: {
          orderCount: { $size: "$totalOrders" }
        }
      }
    ]);

    // Revenue breakdown by client
    const revenueByClient = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: "CANCELLED" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "clients",
          localField: "customer",
          foreignField: "_id",
          as: "client"
        }
      },
      { $unwind: "$client" },
      {
        $group: {
          _id: {
            clientId: "$client._id",
            clientName: { $concat: ["$client.firstName", " ", "$client.lastName"] }
          },
          revenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } },
          orderCount: { $addToSet: "$_id" }
        }
      },
      {
        $addFields: {
          orderCount: { $size: "$orderCount" }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Revenue breakdown by priority
    const revenueByPriority = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: "CANCELLED" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$priority",
          revenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } },
          orderCount: { $addToSet: "$_id" }
        }
      },
      {
        $addFields: {
          orderCount: { $size: "$orderCount" }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Revenue trend (weekly breakdown)
    const revenueTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: "CANCELLED" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            week: { $week: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          weeklyRevenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } },
          orderCount: { $addToSet: "$_id" }
        }
      },
      {
        $addFields: {
          orderCount: { $size: "$orderCount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } }
    ]);

    const avgOrderValue = totalRevenue[0] ? 
      (totalRevenue[0].totalRevenue / totalRevenue[0].orderCount) : 0;

    res.json({
      success: true,
      data: {
        period: { start, end },
        totalRevenue: totalRevenue[0] || { totalRevenue: 0, orderCount: 0, totalItems: 0 },
        avgOrderValue,
        revenueByClient,
        revenueByPriority,
        revenueTrend
      }
    });
  } catch (error) {
    console.error("Error getting financial insights:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve financial insights",
      error: error.message 
    });
  }
};

// AUDIT & SECURITY INSIGHTS (placeholder for when audit log is implemented)
export const getAuditInsights = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const { start, end } = parseDateRange(req);

    // Disabled stages statistics
    const disabledStagesStats = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      { $unwind: { path: "$items.disabledStages", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$items.disabledStages",
          count: { $sum: 1 }
        }
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } }
    ]);

    // Orders with frequent status changes (potential suspicious activity)
    const suspiciousActivity = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $addFields: {
          daysSinceCreation: {
            $divide: [{ $subtract: [new Date(), "$createdAt"] }, 1000 * 60 * 60 * 24]
          }
        }
      },
      {
        $match: {
          $or: [
            { status: "CANCELLED", daysSinceCreation: { $lt: 1 } }, // Cancelled within 1 day
            { updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Updated recently
          ]
        }
      },
      {
        $lookup: {
          from: "clients",
          localField: "customer",
          foreignField: "_id",
          as: "client"
        }
      },
      { $unwind: "$client" },
      {
        $project: {
          _id: 1,
          status: 1,
          priority: 1,
          createdAt: 1,
          updatedAt: 1,
          clientName: { $concat: ["$client.firstName", " ", "$client.lastName"] },
          daysSinceCreation: 1
        }
      },
      { $sort: { updatedAt: -1 } },
      { $limit: 20 }
    ]);

    // Settings health check
    const settingsHealth = {
      totalProducts: await Product.countDocuments(),
      activeEmployees: await Employee.countDocuments(),
      totalClients: await Client.countDocuments(),
      // Add more health checks as needed
    };

    res.json({
      success: true,
      data: {
        period: { start, end },
        disabledStagesStats,
        suspiciousActivity,
        settingsHealth,
        note: "Full audit logging not yet implemented. This shows basic system health and activity patterns."
      }
    });
  } catch (error) {
    console.error("Error getting audit insights:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve audit insights",
      error: error.message 
    });
  }
};

// COMPREHENSIVE DASHBOARD DATA
export const getDashboardInsights = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const { start, end } = parseDateRange(req);

    // Get key metrics for dashboard
    const [
      orderStats,
      revenueStats,
      employeeStats,
      recentOrders,
      upcomingDueDates
    ] = await Promise.all([
      // Order statistics
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  { $and: [{ $lt: ["$dueDate", new Date()] }, { $ne: ["$status", "DONE"] }] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),

      // Revenue statistics
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: "CANCELLED" } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } },
            totalItems: { $sum: "$items.quantity" }
          }
        }
      ]),

      // Employee statistics
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: "$items" },
        { $unwind: "$items.assignments" },
        {
          $group: {
            _id: "$items.assignments.assignedTo",
            activeAssignments: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            activeEmployees: { $sum: 1 },
            totalAssignments: { $sum: "$activeAssignments" }
          }
        }
      ]),

      // Recent orders
      Order.find({ createdAt: { $gte: start, $lte: end } })
        .populate("customer", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Upcoming due dates
      Order.find({
        dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        status: { $nin: ["DONE", "CANCELLED"] }
      })
        .populate("customer", "firstName lastName")
        .sort({ dueDate: 1 })
        .limit(10)
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          orders: orderStats[0] || { total: 0, completed: 0, inProgress: 0, cancelled: 0, overdue: 0 },
          revenue: revenueStats[0] || { totalRevenue: 0, totalItems: 0 },
          employees: employeeStats[0] || { activeEmployees: 0, totalAssignments: 0 }
        },
        recentOrders,
        upcomingDueDates
      }
    });
  } catch (error) {
    console.error("Error getting dashboard insights:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve dashboard insights",
      error: error.message 
    });
  }
};
