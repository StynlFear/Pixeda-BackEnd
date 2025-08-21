export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Pixeda Backend API",
    version: "1.0.0",
    description:
      "Secure REST API for Pixeda (employees + auth). Access token via Bearer, refresh token via httpOnly cookie.",
    contact: { name: "Pixeda", url: "https://pixeda.ro" }
  },
  servers: [{ url: "http://localhost:8000" }],
  tags: [
    { name: "Auth", description: "Login / token refresh / logout" },
    { name: "Employees", description: "CRUD employees (admin required for write ops)" },
    { name: "Clients", description: "CRUD clients (admin required for write ops)" },
    { name: "Companies", description: "CRUD companies (admin required for write ops)" },
    { name: "Products", description: "CRUD products (admin required for write ops)" },
    { name: "Orders", description: "CRUD orders with image upload support" },
    { name: "Uploads", description: "File serving endpoints" },
    { name: "Insights", description: "Business analytics and insights (admin only)" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    schemas: {
      Employee: {
        type: "object",
        properties: {
          _id: { type: "string", example: "66b8b2a2b59c0b7f1b3f4a1d" },
          firstName: { type: "string", example: "Ana" },
          lastName: { type: "string", example: "Popescu" },
          email: { type: "string", example: "ana@pixeda.ro" },
          phone: { type: "string", example: "+40 7xx xxx xxx" },
          position: { type: "string", enum: ["employee", "admin"], example: "admin" },
          hireDate: { type: "string", format: "date", example: "2024-03-15" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      EmployeeCreate: {
        type: "object",
        required: ["firstName", "lastName", "email", "position", "password"],
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          position: { type: "string", enum: ["employee", "admin"] },
          password: { type: "string", minLength: 6 },
          hireDate: { type: "string", format: "date" }
        }
      },
      EmployeeUpdate: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          position: { type: "string", enum: ["employee", "admin"] },
          password: { type: "string", minLength: 6 },
          hireDate: { type: "string", format: "date" }
        }
      },
      PaginatedEmployees: {
        type: "object",
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/Employee" } },
          total: { type: "integer", example: 42 },
          page: { type: "integer", example: 1 },
          pages: { type: "integer", example: 5 }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@pixeda.ro" },
          password: { type: "string", example: "secret123" }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          user: { $ref: "#/components/schemas/Employee" }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" }
        }
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                msg: { type: "string" },
                param: { type: "string" },
                location: { type: "string" }
              }
            }
          }
        }
      },
      Client: {
  type: "object",
  properties: {
    _id: { type: "string", example: "66b8b2a2b59c0b7f1b3f4a1d" },
    firstName: { type: "string", example: "Ion" },
    lastName: { type: "string", example: "Ionescu" },
    companies: {
      type: "array",
      items: { $ref: "#/components/schemas/Company" },
      description: "Array of company references (populated)"
    },
    phone: { type: "string", example: "+40 7xx xxx xxx" },
    whatsapp: { type: "string", example: "+40 7yy yyy yyy" },
    email: { type: "string", example: "client@firma.ro" },
    defaultFolderPath: { type: "string", example: "/clients/personal", description: "Folder path for personal orders (when not ordering through a company)" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  }
},
ClientCreate: {
  type: "object",
  required: ["firstName", "lastName"],
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    companies: {
      type: "array",
      items: { type: "string" },
      description: "Array of company IDs"
    },
    phone: { type: "string" },
    whatsapp: { type: "string" },
    email: { type: "string", format: "email" },
    defaultFolderPath: { type: "string" }
  }
},
ClientUpdate: {
  type: "object",
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    companies: {
      type: "array",
      items: { type: "string" },
      description: "Array of company IDs"
    },
    phone: { type: "string" },
    whatsapp: { type: "string" },
    email: { type: "string", format: "email" },
    defaultFolderPath: { type: "string" }
  }
},
PaginatedClients: {
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "#/components/schemas/Client" } },
    total: { type: "integer", example: 42 },
    page: { type: "integer", example: 1 },
    limit: { type: "integer", example: 10 },
    sort: { type: "string", example: "-createdAt" }
  }
},
Company: {
  type: "object",
  properties: {
    _id: { type: "string", example: "66c0f1d3d8e4a6a1b2345678" },
    name: { type: "string", example: "Tech Solutions SRL" },
    cui: { type: "string", example: "RO12345678", nullable: true },
    description: { type: "string", example: "Software development company", nullable: true },
    defaultFolderPath: { type: "string", example: "/companies/tech-solutions", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["name"]
},
CompanyCreate: {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string" },
    cui: { type: "string" },
    description: { type: "string" },
    defaultFolderPath: { type: "string" }
  }
},
CompanyUpdate: {
  type: "object",
  properties: {
    name: { type: "string" },
    cui: { type: "string" },
    description: { type: "string" },
    defaultFolderPath: { type: "string" }
  }
},
PaginatedCompanies: {
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "#/components/schemas/Company" } },
    total: { type: "integer", example: 42 },
    page: { type: "integer", example: 1 },
    limit: { type: "integer", example: 10 },
    sort: { type: "string", example: "-createdAt" }
  }
},
Product: {
  type: "object",
  properties: {
    _id: { type: "string", example: "66c0f1d3d8e4a6a1b2345678" },
    type: { type: "string", example: "Banners", nullable: true },
    productName: { type: "string", example: "Large Vinyl Banner" },
    productCode: { type: "string", example: "BAN-VINYL-L" },
    description: { type: "string", example: "Premium outdoor vinyl", nullable: true },
    price: { type: "number", example: 149.99, nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["productName", "productCode"]
},
ProductCreate: {
  type: "object",
  required: ["productName", "productCode"],
  properties: {
    type: { type: "string" },
    productName: { type: "string" },
    productCode: { type: "string" },
    description: { type: "string" },
    price: { type: "number", minimum: 0 }
  }
},
ProductUpdate: {
  type: "object",
  properties: {
    type: { type: "string" },
    productName: { type: "string" },
    productCode: { type: "string" },
    description: { type: "string" },
    price: { type: "number", minimum: 0 }
  }
},
PaginatedProducts: {
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "#/components/schemas/Product" } },
    total: { type: "integer", example: 42 },
    page: { type: "integer", example: 1 },
    pages: { type: "integer", example: 5 }
  }
},
OrderItem: {
  type: "object",
  properties: {
    product: { type: "string", example: "66c0f1d3d8e4a6a1b2345678", description: "Product ID" },
    productNameSnapshot: { type: "string", example: "Large Vinyl Banner" },
    descriptionSnapshot: { type: "string", example: "Premium outdoor vinyl", nullable: true },
    priceSnapshot: { type: "number", example: 149.99, nullable: true },
    quantity: { type: "integer", example: 2, minimum: 1 },
    itemStatus: {
      type: "string",
      enum: ["TO_DO", "GRAPHICS", "PRINTING", "CUTTING", "FINISHING", "PACKING", "DONE", "STANDBY", "CANCELLED"],
      example: "TO_DO"
    },
    attachments: { type: "array", items: { type: "string" }, description: "File paths" },
    graphicsImage: { type: "string", example: "uploads/orders/graphics/order123-item0-design.jpg", nullable: true },
    graphicsImageUrl: { type: "string", example: "/api/uploads/orders/graphics/order123-item0-design.jpg", nullable: true },
    finishedProductImage: { type: "string", example: "uploads/orders/finished/order123-item0-final.jpg", nullable: true },
    finishedProductImageUrl: { type: "string", example: "/api/uploads/orders/finished/order123-item0-final.jpg", nullable: true },
    textToPrint: { type: "string", example: "Custom text content", nullable: true },
    editableFilePath: { type: "string", example: "/files/editable/template.psd", nullable: true },
    printingFilePath: { type: "string", example: "/files/print-ready/final.pdf", nullable: true },
    disabledStages: {
      type: "array",
      items: {
        type: "string",
        enum: ["TO_DO", "GRAPHICS", "PRINTING", "CUTTING", "FINISHING", "PACKING", "DONE", "STANDBY", "CANCELLED"]
      }
    },
    assignments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stage: {
            type: "string",
            enum: ["TO_DO", "GRAPHICS", "PRINTING", "CUTTING", "FINISHING", "PACKING", "DONE", "STANDBY", "CANCELLED"]
          },
          assignedTo: { type: "string", example: "66b8b2a2b59c0b7f1b3f4a1d", description: "Employee ID" },
          stageNotes: { type: "string", example: "Use 350gr matte paper", nullable: true }
        }
      }
    }
  },
  required: ["product", "productNameSnapshot", "quantity"]
},
Order: {
  type: "object",
  properties: {
    _id: { type: "string", example: "66c0f1d3d8e4a6a1b2345678" },
    dueDate: { type: "string", format: "date-time", example: "2024-08-25T10:00:00.000Z" },
    receivedThrough: {
      type: "string",
      enum: ["FACEBOOK", "WHATSAPP", "PHONE", "IN_PERSON", "EMAIL"],
      example: "WHATSAPP"
    },
    status: {
      type: "string",
      enum: ["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"],
      example: "TO_DO"
    },
    customer: { $ref: "#/components/schemas/Client" },
    customerCompany: { $ref: "#/components/schemas/Company", nullable: true },
    priority: {
      type: "string",
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
      example: "NORMAL"
    },
    description: { type: "string", example: "Wedding invitation order", nullable: true },
    items: {
      type: "array",
      items: { $ref: "#/components/schemas/OrderItem" }
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["dueDate", "receivedThrough", "customer", "items"]
},
OrderCreate: {
  type: "object",
  required: ["dueDate", "receivedThrough", "customer", "items"],
  properties: {
    dueDate: { type: "string", format: "date-time" },
    receivedThrough: {
      type: "string",
      enum: ["FACEBOOK", "WHATSAPP", "PHONE", "IN_PERSON", "EMAIL"]
    },
    status: {
      type: "string",
      enum: ["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"],
      default: "TO_DO"
    },
    customer: { type: "string", description: "Client ID" },
    customerCompany: { type: "string", description: "Company ID", nullable: true },
    priority: {
      type: "string",
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
      default: "NORMAL"
    },
    description: { type: "string", nullable: true },
    items: {
      oneOf: [
        { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
        { type: "string", description: "JSON string of items array (for multipart/form-data)" }
      ]
    }
  }
},
OrderUpdate: {
  type: "object",
  properties: {
    dueDate: { type: "string", format: "date-time" },
    receivedThrough: {
      type: "string",
      enum: ["FACEBOOK", "WHATSAPP", "PHONE", "IN_PERSON", "EMAIL"]
    },
    status: {
      type: "string",
      enum: ["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"]
    },
    customer: { type: "string", description: "Client ID" },
    customerCompany: { type: "string", description: "Company ID", nullable: true },
    priority: {
      type: "string",
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"]
    },
    description: { type: "string", nullable: true },
    items: {
      oneOf: [
        { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
        { type: "string", description: "JSON string of items array (for multipart/form-data)" }
      ]
    }
  }
},
PaginatedOrders: {
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "#/components/schemas/Order" } },
    total: { type: "integer", example: 42 },
    page: { type: "integer", example: 1 },
    limit: { type: "integer", example: 10 },
    sort: { type: "string", example: "-createdAt" }
  }
},
DashboardInsights: {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        period: { 
          type: "object",
          properties: {
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" }
          }
        },
        summary: {
          type: "object",
          properties: {
            orders: {
              type: "object",
              properties: {
                total: { type: "integer" },
                completed: { type: "integer" },
                inProgress: { type: "integer" },
                cancelled: { type: "integer" },
                overdue: { type: "integer" }
              }
            },
            revenue: {
              type: "object",
              properties: {
                totalRevenue: { type: "number" },
                totalItems: { type: "integer" }
              }
            },
            employees: {
              type: "object",
              properties: {
                activeEmployees: { type: "integer" },
                totalAssignments: { type: "integer" }
              }
            }
          }
        },
        recentOrders: { type: "array", items: { $ref: "#/components/schemas/Order" } },
        upcomingDueDates: { type: "array", items: { $ref: "#/components/schemas/Order" } }
      }
    }
  }
},
OrderInsights: {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        period: { 
          type: "object",
          properties: {
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" }
          }
        },
        ordersByStatus: {
          type: "array",
          items: {
            type: "object",
            properties: {
              _id: { type: "string" },
              count: { type: "integer" }
            }
          }
        },
        overdueOrders: { type: "array", items: { $ref: "#/components/schemas/Order" } },
        ordersByPriority: {
          type: "array",
          items: {
            type: "object",
            properties: {
              _id: { type: "string" },
              count: { type: "integer" }
            }
          }
        },
        averageCompletionTime: {
          type: "object",
          properties: {
            avgCompletionTime: { type: "number" },
            totalCompleted: { type: "integer" }
          }
        },
        stageBottlenecks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              _id: { type: "string" },
              count: { type: "integer" },
              avgTimeInStage: { type: "number" }
            }
          }
        },
        assignmentOverview: { type: "array" }
      }
    }
  }
},
EmployeeInsights: {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        period: { 
          type: "object",
          properties: {
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" }
          }
        },
        workloadDistribution: { type: "array" },
        employeeTurnaroundTime: { type: "array" },
        employeeActivity: { type: "array" },
        summary: {
          type: "object",
          properties: {
            totalEmployees: { type: "integer" },
            activeEmployees: { type: "integer" },
            inactiveEmployees: { type: "integer" }
          }
        }
      }
    }
  }
},
ClientInsights: {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        period: { 
          type: "object",
          properties: {
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" }
          }
        },
        topClientsByOrders: { type: "array" },
        clientAnalysis: {
          type: "object",
          properties: {
            newClients: { type: "integer" },
            returningClients: { type: "integer" },
            totalClients: { type: "integer" }
          }
        },
        atRiskClients: { type: "array" }
      }
    }
  }
},
ProductInsights: {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        period: { 
          type: "object",
          properties: {
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" }
          }
        },
        productTypeStats: { type: "array" },
        revenueByProductType: { type: "array" },
        rarelyOrderedProducts: { type: "array", items: { $ref: "#/components/schemas/Product" } },
        summary: {
          type: "object",
          properties: {
            totalProducts: { type: "integer" },
            activeProducts: { type: "integer" },
            rarelyOrderedCount: { type: "integer" }
          }
        }
      }
    }
  }
},
FinancialInsights: {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        period: { 
          type: "object",
          properties: {
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" }
          }
        },
        totalRevenue: {
          type: "object",
          properties: {
            totalRevenue: { type: "number" },
            orderCount: { type: "integer" },
            totalItems: { type: "integer" }
          }
        },
        avgOrderValue: { type: "number" },
        revenueByClient: { type: "array" },
        revenueByPriority: { type: "array" },
        revenueTrend: { type: "array" }
      }
    }
  }
},
AuditInsights: {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        period: { 
          type: "object",
          properties: {
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" }
          }
        },
        disabledStagesStats: { type: "array" },
        suspiciousActivity: { type: "array" },
        settingsHealth: {
          type: "object",
          properties: {
            totalProducts: { type: "integer" },
            activeEmployees: { type: "integer" },
            totalClients: { type: "integer" }
          }
        },
        note: { type: "string" }
      }
    }
  }
}
    }
  },
  paths: {
    "/api/products": {
  get: {
    tags: ["Products"],
    summary: "List products (paginated, searchable, filterable)",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "q", in: "query", schema: { type: "string" }, description: "Full‑text on name/code" },
      { name: "type", in: "query", schema: { type: "string" } },
      { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 10, minimum: 1, maximum: 100 } },
      { name: "sortBy", in: "query", schema: { type: "string", enum: ["productName","productCode","price","createdAt","updatedAt"], default: "createdAt" } },
      { name: "order", in: "query", schema: { type: "string", enum: ["asc","desc"], default: "desc" } }
    ],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedProducts" } } } },
      401: { description: "Unauthorized" }
    }
  },
  post: {
    tags: ["Products"],
    summary: "Create product (admin)",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ProductCreate" } } }
    },
    responses: {
      201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
      409: { description: "productCode already exists" },
      422: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  }
},

"/api/products/{id}": {
  get: {
    tags: ["Products"],
    summary: "Get product by id",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
      404: { description: "Not found" },
      401: { description: "Unauthorized" }
    }
  },
  put: {
    tags: ["Products"],
    summary: "Update product (admin)",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ProductUpdate" } } }
    },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
      404: { description: "Not found" },
      422: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  },
  delete: {
    tags: ["Products"],
    summary: "Delete product (admin)",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } } },
      404: { description: "Not found" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  }
},

    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email & password",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } }
        },
        responses: {
          200: {
            description: "OK",
            headers: {
              "Set-Cookie": { description: "rt refresh cookie (httpOnly)", schema: { type: "string" } }
            },
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } }
          },
          401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          422: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationErrorResponse" } } } }
        }
      }
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate refresh cookie and get a new access token",
        responses: {
          200: {
            description: "OK",
            content: { "application/json": { schema: { type: "object", properties: { accessToken: { type: "string" } } } } }
          },
          401: { description: "Missing/invalid refresh cookie", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (revoke current session)",
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } } }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Read current token payload",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { user: { type: "object" } } } } } },
          401: { description: "Unauthorized" }
        }
      }
    },

    "/api/employees": {
      get: {
        tags: ["Employees"],
        summary: "List employees (paginated)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Search first/last/email/phone" },
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10, minimum: 1, maximum: 100 } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["firstName","lastName","email","createdAt","updatedAt"], default: "createdAt" } },
          { name: "order", in: "query", schema: { type: "string", enum: ["asc","desc"], default: "desc" } }
        ],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedEmployees" } } } },
          401: { description: "Unauthorized" }
        }
      },
      post: {
        tags: ["Employees"],
        summary: "Create employee (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/EmployeeCreate" } } }
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Employee" } } } },
          409: { description: "Email already exists" },
          422: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" }
        }
      }
    },

    "/api/employees/{id}": {
      get: {
        tags: ["Employees"],
        summary: "Get employee by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Employee" } } } },
          404: { description: "Not found" },
          401: { description: "Unauthorized" }
        }
      },
      put: {
        tags: ["Employees"],
        summary: "Update employee (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/EmployeeUpdate" } } }
        },
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Employee" } } } },
          404: { description: "Not found" },
          422: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" }
        }
      },
      delete: {
        tags: ["Employees"],
        summary: "Delete employee (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } } },
          404: { description: "Not found" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" }
        }
      }
    },
    "/api/clients": {
  get: {
    tags: ["Clients"],
    summary: "List clients (paginated)",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "search", in: "query", schema: { type: "string" }, description: "Search by name/companies/email/phones" },
      { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 10, minimum: 1, maximum: 100 } },
      { name: "sort", in: "query", schema: { type: "string", example: "-createdAt" } }
    ],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedClients" } } } },
      401: { description: "Unauthorized" }
    }
  },
  post: {
    tags: ["Clients"],
    summary: "Create client (admin)",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ClientCreate" } } }
    },
    responses: {
      201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Client" } } } },
      409: { description: "Duplicate entry" },
      422: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  }
},
"/api/clients/{id}": {
  get: {
    tags: ["Clients"],
    summary: "Get client by id",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Client" } } } },
      404: { description: "Not found" },
      401: { description: "Unauthorized" }
    }
  },
  put: {
    tags: ["Clients"],
    summary: "Update client (admin)",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ClientUpdate" } } }
    },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Client" } } } },
      404: { description: "Not found" },
      422: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  },
  delete: {
    tags: ["Clients"],
    summary: "Delete client (admin)",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
      404: { description: "Not found" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  }
},

"/api/companies": {
  get: {
    tags: ["Companies"],
    summary: "List companies (paginated)",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "search", in: "query", schema: { type: "string" }, description: "Search by name/cui/description" },
      { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 10, minimum: 1, maximum: 100 } },
      { name: "sort", in: "query", schema: { type: "string", example: "-createdAt" } }
    ],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedCompanies" } } } },
      401: { description: "Unauthorized" }
    }
  },
  post: {
    tags: ["Companies"],
    summary: "Create company (admin)",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/CompanyCreate" } } }
    },
    responses: {
      201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Company" } } } },
      400: { description: "Duplicate CUI or validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  }
},

"/api/companies/{id}": {
  get: {
    tags: ["Companies"],
    summary: "Get company by id",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Company" } } } },
      404: { description: "Not found" },
      401: { description: "Unauthorized" }
    }
  },
  put: {
    tags: ["Companies"],
    summary: "Update company (admin)",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/CompanyUpdate" } } }
    },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Company" } } } },
      404: { description: "Not found" },
      400: { description: "Duplicate CUI or validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  },
  delete: {
    tags: ["Companies"],
    summary: "Delete company (admin)",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
      404: { description: "Not found" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  }
},

"/api/orders": {
  get: {
    tags: ["Orders"],
    summary: "List orders (paginated, searchable, filterable)",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "search", in: "query", schema: { type: "string" }, description: "Full-text search in order description and items" },
      { name: "status", in: "query", schema: { type: "string", enum: ["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"] } },
      { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "NORMAL", "HIGH", "URGENT"] } },
      { name: "customer", in: "query", schema: { type: "string" }, description: "Filter by customer ID" },
      { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 10, minimum: 1, maximum: 100 } },
      { name: "sort", in: "query", schema: { type: "string", example: "-createdAt" } }
    ],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedOrders" } } } },
      401: { description: "Unauthorized" }
    }
  },
  post: {
    tags: ["Orders"],
    summary: "Create order with image uploads",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              dueDate: { type: "string", format: "date-time" },
              receivedThrough: { type: "string", enum: ["FACEBOOK", "WHATSAPP", "PHONE", "IN_PERSON", "EMAIL"] },
              status: { type: "string", enum: ["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"] },
              customer: { type: "string", description: "Client ID" },
              customerCompany: { type: "string", description: "Company ID" },
              priority: { type: "string", enum: ["LOW", "NORMAL", "HIGH", "URGENT"] },
              description: { type: "string" },
              items: { type: "string", description: "JSON string of items array" },
              "items[0][graphicsImage]": { type: "string", format: "binary", description: "Graphics image for first item" },
              "items[0][finishedProductImage]": { type: "string", format: "binary", description: "Finished product image for first item" },
              "items[0][attachments]": { type: "array", items: { type: "string", format: "binary" }, description: "Attachments for first item" }
            },
            required: ["dueDate", "receivedThrough", "customer", "items"]
          }
        },
        "application/json": {
          schema: { $ref: "#/components/schemas/OrderCreate" }
        }
      }
    },
    responses: {
      201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
      400: { description: "Validation error or file upload error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  }
},

"/api/orders/{id}": {
  get: {
    tags: ["Orders"],
    summary: "Get order by id",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
      404: { description: "Not found" },
      401: { description: "Unauthorized" }
    }
  },
  put: {
    tags: ["Orders"],
    summary: "Update order with image uploads",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              dueDate: { type: "string", format: "date-time" },
              receivedThrough: { type: "string", enum: ["FACEBOOK", "WHATSAPP", "PHONE", "IN_PERSON", "EMAIL"] },
              status: { type: "string", enum: ["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"] },
              customer: { type: "string", description: "Client ID" },
              customerCompany: { type: "string", description: "Company ID" },
              priority: { type: "string", enum: ["LOW", "NORMAL", "HIGH", "URGENT"] },
              description: { type: "string" },
              items: { type: "string", description: "JSON string of items array" },
              "items[0][graphicsImage]": { type: "string", format: "binary", description: "Graphics image for first item" },
              "items[0][finishedProductImage]": { type: "string", format: "binary", description: "Finished product image for first item" },
              "items[0][attachments]": { type: "array", items: { type: "string", format: "binary" }, description: "Attachments for first item" }
            }
          }
        },
        "application/json": {
          schema: { $ref: "#/components/schemas/OrderUpdate" }
        }
      }
    },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
      404: { description: "Not found" },
      400: { description: "Validation error or file upload error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  },
  delete: {
    tags: ["Orders"],
    summary: "Delete order",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
      404: { description: "Not found" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  }
},

"/api/orders/{id}/status": {
  patch: {
    tags: ["Orders"],
    summary: "Update order status",
    security: [{ bearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["status"],
            properties: {
              status: {
                type: "string",
                enum: ["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"]
              }
            }
          }
        }
      }
    },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
      404: { description: "Not found" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  }
},

"/api/orders/{id}/items/{itemId}/status": {
  patch: {
    tags: ["Orders"],
    summary: "Update order item status",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Order ID" },
      { name: "itemId", in: "path", required: true, schema: { type: "string" }, description: "Item ID" }
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["itemStatus"],
            properties: {
              itemStatus: {
                type: "string",
                enum: ["TO_DO", "GRAPHICS", "PRINTING", "CUTTING", "FINISHING", "PACKING", "DONE", "STANDBY", "CANCELLED"]
              }
            }
          }
        }
      }
    },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
      404: { description: "Order or item not found" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" }
    }
  }
},

"/api/orders/{id}/preview": {
  get: {
    tags: ["Orders"],
    summary: "Preview order HTML (for debugging PDF generation)",
    description: "Generate and view the HTML version of the order that would be used for PDF generation",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Order ID" }
    ],
    responses: {
      200: { 
        description: "HTML preview", 
        content: { 
          "text/html": { 
            schema: { type: "string" } 
          } 
        }
      },
      404: { description: "Order not found" },
      401: { description: "Unauthorized" },
      500: { description: "HTML generation failed" }
    }
  }
},

"/api/orders/{id}/pdf": {
  get: {
    tags: ["Orders"],
    summary: "Export order as PDF",
    description: "Generate and download a PDF version of the order that looks like a purchase order",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Order ID" }
    ],
    responses: {
      200: { 
        description: "PDF file", 
        content: { 
          "application/pdf": { 
            schema: { type: "string", format: "binary" } 
          } 
        },
        headers: {
          "Content-Disposition": {
            description: "Attachment filename",
            schema: { type: "string", example: "attachment; filename=\"order-ABC12345.pdf\"" }
          }
        }
      },
      404: { description: "Order not found" },
      401: { description: "Unauthorized" },
      500: { description: "PDF generation failed" }
    }
  }
},

"/api/uploads/{filePath}": {
  get: {
    tags: ["Uploads"],
    summary: "Serve uploaded files",
    parameters: [
      { name: "filePath", in: "path", required: true, schema: { type: "string" }, description: "File path relative to uploads directory" }
    ],
    responses: {
      200: { description: "File content", content: { "image/*": { schema: { type: "string", format: "binary" } } } },
      404: { description: "File not found" },
      403: { description: "Access denied" },
      500: { description: "Error serving file" }
    }
  }
},

"/api/insights/dashboard": {
  get: {
    tags: ["Insights"],
    summary: "Get comprehensive dashboard insights",
    description: "Returns key metrics and insights for admin dashboard including order stats, revenue, employee metrics, recent orders, and upcoming due dates",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "startDate", in: "query", schema: { type: "string", format: "date" }, description: "Start date for insights period" },
      { name: "endDate", in: "query", schema: { type: "string", format: "date" }, description: "End date for insights period" },
      { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d", "1y"] }, description: "Predefined period" }
    ],
    responses: {
      200: { description: "Dashboard insights", content: { "application/json": { schema: { $ref: "#/components/schemas/DashboardInsights" } } } },
      401: { description: "Unauthorized" },
      403: { description: "Admin access required" }
    }
  }
},

"/api/insights/orders": {
  get: {
    tags: ["Insights"],
    summary: "Get order and workflow insights",
    description: "Returns order analytics including status distribution, overdue orders, priority breakdown, completion times, and bottlenecks",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "startDate", in: "query", schema: { type: "string", format: "date" }, description: "Start date for insights period" },
      { name: "endDate", in: "query", schema: { type: "string", format: "date" }, description: "End date for insights period" },
      { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d", "1y"] }, description: "Predefined period" }
    ],
    responses: {
      200: { description: "Order insights", content: { "application/json": { schema: { $ref: "#/components/schemas/OrderInsights" } } } },
      401: { description: "Unauthorized" },
      403: { description: "Admin access required" }
    }
  }
},

"/api/insights/employees": {
  get: {
    tags: ["Insights"],
    summary: "Get employee performance insights",
    description: "Returns employee analytics including workload distribution, completion rates, turnaround times, and activity status",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "startDate", in: "query", schema: { type: "string", format: "date" }, description: "Start date for insights period" },
      { name: "endDate", in: "query", schema: { type: "string", format: "date" }, description: "End date for insights period" },
      { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d", "1y"] }, description: "Predefined period" }
    ],
    responses: {
      200: { description: "Employee insights", content: { "application/json": { schema: { $ref: "#/components/schemas/EmployeeInsights" } } } },
      401: { description: "Unauthorized" },
      403: { description: "Admin access required" }
    }
  }
},

"/api/insights/clients": {
  get: {
    tags: ["Insights"],
    summary: "Get client insights",
    description: "Returns client analytics including top clients by orders/revenue, new vs returning clients, and at-risk clients",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "startDate", in: "query", schema: { type: "string", format: "date" }, description: "Start date for insights period" },
      { name: "endDate", in: "query", schema: { type: "string", format: "date" }, description: "End date for insights period" },
      { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d", "1y"] }, description: "Predefined period" }
    ],
    responses: {
      200: { description: "Client insights", content: { "application/json": { schema: { $ref: "#/components/schemas/ClientInsights" } } } },
      401: { description: "Unauthorized" },
      403: { description: "Admin access required" }
    }
  }
},

"/api/insights/products": {
  get: {
    tags: ["Insights"],
    summary: "Get product insights",
    description: "Returns product analytics including most ordered types, revenue contribution, and rarely ordered products",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "startDate", in: "query", schema: { type: "string", format: "date" }, description: "Start date for insights period" },
      { name: "endDate", in: "query", schema: { type: "string", format: "date" }, description: "End date for insights period" },
      { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d", "1y"] }, description: "Predefined period" }
    ],
    responses: {
      200: { description: "Product insights", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInsights" } } } },
      401: { description: "Unauthorized" },
      403: { description: "Admin access required" }
    }
  }
},

"/api/insights/financial": {
  get: {
    tags: ["Insights"],
    summary: "Get financial insights",
    description: "Returns financial analytics including total revenue, revenue breakdowns, average order value, and revenue trends",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "startDate", in: "query", schema: { type: "string", format: "date" }, description: "Start date for insights period" },
      { name: "endDate", in: "query", schema: { type: "string", format: "date" }, description: "End date for insights period" },
      { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d", "1y"] }, description: "Predefined period" }
    ],
    responses: {
      200: { description: "Financial insights", content: { "application/json": { schema: { $ref: "#/components/schemas/FinancialInsights" } } } },
      401: { description: "Unauthorized" },
      403: { description: "Admin access required" }
    }
  }
},

"/api/insights/audit": {
  get: {
    tags: ["Insights"],
    summary: "Get audit and security insights",
    description: "Returns audit and security analytics including disabled stages statistics, suspicious activity, and system health",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "startDate", in: "query", schema: { type: "string", format: "date" }, description: "Start date for insights period" },
      { name: "endDate", in: "query", schema: { type: "string", format: "date" }, description: "End date for insights period" },
      { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d", "1y"] }, description: "Predefined period" }
    ],
    responses: {
      200: { description: "Audit insights", content: { "application/json": { schema: { $ref: "#/components/schemas/AuditInsights" } } } },
      401: { description: "Unauthorized" },
      403: { description: "Admin access required" }
    }
  }
}
  }
};
