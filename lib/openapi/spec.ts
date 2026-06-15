import type { OpenAPIV3 } from "openapi-types";

const errorSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  properties: {
    message: { type: "string", example: "Access denied: insufficient permissions." },
  },
  required: ["message"],
};

const paginationQuery: OpenAPIV3.ParameterObject[] = [
  {
    name: "page",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  {
    name: "pageSize",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
  },
];

export function getOpenApiDocument(): OpenAPIV3.Document {
  return {
    openapi: "3.0.3",
    info: {
      title: "StockMind API",
      description: [
        "REST API for the StockMind inventory management platform.",
        "",
        "**Authentication:** Most endpoints require a valid NextAuth session cookie.",
        "Log in at `/login` in the same browser before using *Try it out* in Swagger UI.",
        "",
        "**Roles:** `ADMIN` and `STAFF` — permissions vary per endpoint.",
      ].join("\n"),
      version: "1.0.0",
      contact: {
        name: "StockMind",
      },
    },
    servers: [
      {
        url: "/",
        description: "Current host",
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication and registration" },
      { name: "Users", description: "User administration (Admin)" },
      { name: "Dashboard", description: "Dashboard aggregates" },
      { name: "Products", description: "Product catalog" },
      { name: "Categories", description: "Product categories" },
      { name: "Suppliers", description: "Suppliers" },
      { name: "Inventory", description: "Stock levels and movements" },
      { name: "Transactions", description: "Stock movement history" },
      { name: "Reports", description: "Reports and exports" },
      { name: "Activity Logs", description: "Audit trail" },
      { name: "Notifications", description: "In-app notifications" },
      { name: "Emails", description: "Supplier email actions" },
      { name: "StockPilot", description: "AI assistant (chat, voice, sessions)" },
      { name: "Realtime", description: "WebSocket bootstrap" },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "next-auth.session-token",
          description:
            "NextAuth JWT session cookie. Obtain by signing in at /login.",
        },
      },
      schemas: {
        Error: errorSchema,
        Role: { type: "string", enum: ["ADMIN", "STAFF"] },
        TransactionType: { type: "string", enum: ["STOCK_IN", "STOCK_OUT"] },
        ProductPayload: {
          type: "object",
          required: [
            "name",
            "sku",
            "price",
            "quantity",
            "lowStockThreshold",
            "categoryId",
            "supplierId",
          ],
          properties: {
            name: { type: "string", example: "Engine Oil 5W-30 (4L)" },
            sku: { type: "string", example: "ENG-OIL-5W30" },
            price: { type: "number", format: "float", example: 45000 },
            quantity: { type: "integer", minimum: 0, example: 0 },
            lowStockThreshold: { type: "integer", minimum: 0, example: 10 },
            categoryId: { type: "string" },
            supplierId: { type: "string" },
          },
        },
        CategoryPayload: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Automotive" },
            description: { type: "string", example: "Vehicle parts and fluids" },
          },
        },
        SupplierPayload: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "AutoParts Ltd" },
            contactPerson: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            isActive: { type: "boolean", default: true },
          },
        },
        StockMovementPayload: {
          type: "object",
          required: ["productId", "type", "quantity"],
          properties: {
            productId: { type: "string" },
            type: { $ref: "#/components/schemas/TransactionType" },
            quantity: { type: "integer", minimum: 1, example: 5 },
          },
        },
        CreateUserPayload: {
          type: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: { type: "string", example: "Jane Staff" },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
            role: { $ref: "#/components/schemas/Role" },
          },
        },
        ChatRequest: {
          type: "object",
          required: ["sessionId", "message"],
          properties: {
            sessionId: { type: "string", format: "uuid" },
            message: { type: "string", example: "Show low stock products" },
            responseMode: {
              type: "string",
              enum: ["compact", "detailed"],
              default: "detailed",
            },
            interactionMode: {
              type: "string",
              enum: ["text", "voice"],
              default: "text",
            },
          },
        },
        ChatResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            pendingConfirmation: { type: "boolean" },
            pendingActionSummary: { type: "string", nullable: true },
          },
        },
        RestockEmailPayload: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: { type: "string" },
            requestedQuantity: { type: "integer", minimum: 1 },
            message: { type: "string" },
          },
        },
        TtsRequest: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", maxLength: 4000 },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Not authenticated",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        Forbidden: {
          description: "Insufficient permissions",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
      },
    },
    security: [{ sessionCookie: [] }],
    paths: {
      "/api/auth/signup": {
        post: {
          tags: ["Auth"],
          summary: "Public signup (disabled)",
          description: "Public registration is disabled. Users are created by an administrator.",
          security: [],
          responses: {
            "403": {
              description: "Registration disabled",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example:
                          "Public registration is disabled. Ask an administrator to create your account.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/users": {
        get: {
          tags: ["Users"],
          summary: "List users",
          description: "Requires `MANAGE_USERS` (Admin).",
          responses: {
            "200": { description: "List of users" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Users"],
          summary: "Create user",
          description: "Requires `MANAGE_USERS` (Admin).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateUserPayload" },
              },
            },
          },
          responses: {
            "201": { description: "User created" },
            "400": { description: "Validation error" },
            "409": { description: "Email already exists" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/dashboard": {
        get: {
          tags: ["Dashboard"],
          summary: "Dashboard overview",
          description: "Summary metrics, charts, recent transactions, low-stock items. Requires `VIEW_DASHBOARD`.",
          responses: {
            "200": { description: "Dashboard data" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/products": {
        get: {
          tags: ["Products"],
          summary: "List products",
          description: "Requires `VIEW_PRODUCTS`. Set `includeOptions=1` to include category/supplier options for forms.",
          parameters: [
            ...paginationQuery,
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "categoryId", in: "query", schema: { type: "string" } },
            {
              name: "sortBy",
              in: "query",
              schema: {
                type: "string",
                enum: ["name", "price", "quantity", "createdAt"],
                default: "createdAt",
              },
            },
            {
              name: "sortDir",
              in: "query",
              schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
            },
            {
              name: "includeOptions",
              in: "query",
              schema: { type: "string", enum: ["1"] },
            },
          ],
          responses: {
            "200": { description: "Paginated product list" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Products"],
          summary: "Create product",
          description: "Requires `MANAGE_PRODUCTS`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductPayload" },
              },
            },
          },
          responses: {
            "201": { description: "Product created" },
            "400": { description: "Validation error" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/products/{id}": {
        patch: {
          tags: ["Products"],
          summary: "Update product",
          description:
            "Requires `MANAGE_PRODUCTS`. Quantity cannot be changed here — use stock movements.",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductPayload" },
              },
            },
          },
          responses: {
            "200": { description: "Product updated" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        delete: {
          tags: ["Products"],
          summary: "Delete product",
          description: "Requires `DELETE_PRODUCTS`.",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { ok: { type: "boolean", example: true } },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/products/options": {
        get: {
          tags: ["Products"],
          summary: "Product form options",
          description: "Category and supplier dropdown options. Requires `MANAGE_PRODUCTS`.",
          responses: {
            "200": { description: "Form options" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/categories": {
        get: {
          tags: ["Categories"],
          summary: "List categories",
          description: "Requires `VIEW_CATEGORIES`.",
          parameters: [{ name: "search", in: "query", schema: { type: "string" } }],
          responses: {
            "200": { description: "Category list" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Categories"],
          summary: "Create category",
          description: "Requires `MANAGE_CATEGORIES`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CategoryPayload" },
              },
            },
          },
          responses: {
            "201": { description: "Category created" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/categories/{id}": {
        patch: {
          tags: ["Categories"],
          summary: "Update category",
          description: "Requires `UPDATE_CATEGORIES`.",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CategoryPayload" },
              },
            },
          },
          responses: {
            "200": { description: "Category updated" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        delete: {
          tags: ["Categories"],
          summary: "Delete category",
          description: "Requires `MANAGE_CATEGORIES`.",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { ok: { type: "boolean" } },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/suppliers": {
        get: {
          tags: ["Suppliers"],
          summary: "List suppliers",
          description: "Requires `VIEW_SUPPLIERS`.",
          parameters: [
            ...paginationQuery,
            { name: "search", in: "query", schema: { type: "string" } },
            {
              name: "sortBy",
              in: "query",
              schema: { type: "string", enum: ["name", "createdAt"] },
            },
            {
              name: "sortDir",
              in: "query",
              schema: { type: "string", enum: ["asc", "desc"] },
            },
          ],
          responses: {
            "200": { description: "Paginated supplier list" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Suppliers"],
          summary: "Create supplier",
          description: "Requires `MANAGE_SUPPLIERS`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SupplierPayload" },
              },
            },
          },
          responses: {
            "201": { description: "Supplier created" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/suppliers/{id}": {
        patch: {
          tags: ["Suppliers"],
          summary: "Update supplier",
          description: "Requires `MANAGE_SUPPLIERS`.",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SupplierPayload" },
              },
            },
          },
          responses: {
            "200": { description: "Supplier updated" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        delete: {
          tags: ["Suppliers"],
          summary: "Delete supplier",
          description: "Requires `MANAGE_SUPPLIERS`.",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { ok: { type: "boolean" } },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/inventory/summary": {
        get: {
          tags: ["Inventory"],
          summary: "Inventory summary",
          description:
            "Total SKUs, inventory value, items needing reorder. Requires `VIEW_INVENTORY`.",
          responses: {
            "200": { description: "Inventory summary" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/inventory/stock": {
        post: {
          tags: ["Inventory"],
          summary: "Record stock movement",
          description: "Stock in or stock out. Requires `OPERATE_STOCK`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StockMovementPayload" },
              },
            },
          },
          responses: {
            "201": { description: "Movement recorded" },
            "400": { description: "Validation or insufficient stock" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/transactions": {
        get: {
          tags: ["Transactions"],
          summary: "List transactions",
          description: "Read-only stock movement log. Requires `VIEW_TRANSACTIONS`.",
          parameters: [
            ...paginationQuery,
            { name: "search", in: "query", schema: { type: "string" } },
            {
              name: "type",
              in: "query",
              schema: { $ref: "#/components/schemas/TransactionType" },
            },
            { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
            { name: "dateTo", in: "query", schema: { type: "string", format: "date" } },
            {
              name: "sortBy",
              in: "query",
              schema: { type: "string", enum: ["createdAt", "quantity"] },
            },
            {
              name: "sortDir",
              in: "query",
              schema: { type: "string", enum: ["asc", "desc"] },
            },
          ],
          responses: {
            "200": { description: "Paginated transactions" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/reports": {
        get: {
          tags: ["Reports"],
          summary: "Reports data",
          description: "Stock summary, low stock, transaction summary. Requires `VIEW_REPORTS`.",
          parameters: [
            { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
            { name: "dateTo", in: "query", schema: { type: "string", format: "date" } },
            { name: "productId", in: "query", schema: { type: "string" } },
            { name: "categoryId", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Reports payload" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/reports/export": {
        get: {
          tags: ["Reports"],
          summary: "Export report as CSV",
          description: "Requires `VIEW_REPORTS`.",
          parameters: [
            {
              name: "section",
              in: "query",
              required: true,
              schema: {
                type: "string",
                enum: [
                  "stock-summary",
                  "low-stock",
                  "transaction-summary",
                  "available-products",
                ],
              },
            },
            { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
            { name: "dateTo", in: "query", schema: { type: "string", format: "date" } },
            { name: "productId", in: "query", schema: { type: "string" } },
            { name: "categoryId", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "CSV file",
              content: { "text/csv": { schema: { type: "string" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/activity-logs": {
        get: {
          tags: ["Activity Logs"],
          summary: "List activity logs",
          description: "Requires `VIEW_ACTIVITY_LOGS`.",
          parameters: [
            ...paginationQuery,
            { name: "search", in: "query", schema: { type: "string" } },
            {
              name: "action",
              in: "query",
              schema: { type: "string", enum: ["CREATE", "UPDATE", "DELETE"] },
            },
            {
              name: "entity",
              in: "query",
              schema: {
                type: "string",
                enum: ["PRODUCT", "CATEGORY", "SUPPLIER", "USER"],
              },
            },
            { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
            { name: "dateTo", in: "query", schema: { type: "string", format: "date" } },
            {
              name: "sortDir",
              in: "query",
              schema: { type: "string", enum: ["asc", "desc"] },
            },
          ],
          responses: {
            "200": { description: "Paginated activity logs" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/notifications": {
        get: {
          tags: ["Notifications"],
          summary: "List notifications",
          description: "Current user's notifications.",
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 8 },
            },
          ],
          responses: {
            "200": { description: "Notifications with unread count" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/notifications/read-all": {
        patch: {
          tags: ["Notifications"],
          summary: "Mark all notifications read",
          responses: {
            "200": { description: "OK" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/notifications/{id}/read": {
        patch: {
          tags: ["Notifications"],
          summary: "Mark notification read",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { ok: { type: "boolean" } },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/emails/restock-request": {
        post: {
          tags: ["Emails"],
          summary: "Send supplier restock email",
          description: "Requires `SEND_NOTIFICATIONS` (Admin).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RestockEmailPayload" },
              },
            },
          },
          responses: {
            "201": { description: "Email sent" },
            "400": { description: "Validation error" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/chat": {
        post: {
          tags: ["StockPilot"],
          summary: "Send chat message",
          description: [
            "StockPilot AI assistant. Requires authenticated session and `VIEW_INVENTORY`.",
            "Accepts `application/json` or `multipart/form-data` (with file attachments).",
          ].join(" "),
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChatRequest" },
              },
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["sessionId"],
                  properties: {
                    sessionId: { type: "string" },
                    message: { type: "string" },
                    responseMode: {
                      type: "string",
                      enum: ["compact", "detailed"],
                    },
                    interactionMode: { type: "string", enum: ["text", "voice"] },
                    files: {
                      type: "array",
                      items: { type: "string", format: "binary" },
                      description: "JPG, PNG, GIF, WebP, PDF, XLS/XLSX, DOCX",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Assistant reply",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ChatResponse" },
                },
              },
            },
            "400": { description: "Invalid payload" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "500": { description: "AI or server error" },
          },
        },
      },
      "/api/chat/sessions": {
        get: {
          tags: ["StockPilot"],
          summary: "List chat sessions",
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 30 },
            },
          ],
          responses: {
            "200": { description: "Session list" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/chat/history": {
        get: {
          tags: ["StockPilot"],
          summary: "Load chat history",
          parameters: [
            {
              name: "sessionId",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Message transcript" },
            "400": { description: "Missing sessionId" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/chat/pending": {
        get: {
          tags: ["StockPilot"],
          summary: "Pending sensitive action",
          parameters: [
            {
              name: "sessionId",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Pending confirmation state",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      pendingConfirmation: { type: "boolean" },
                      pendingActionSummary: { type: "string", nullable: true },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/chat/speech-to-text": {
        post: {
          tags: ["StockPilot"],
          summary: "Speech to text (Deepgram)",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["audio"],
                  properties: {
                    audio: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Transcript",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { transcript: { type: "string" } },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/chat/text-to-speech": {
        post: {
          tags: ["StockPilot"],
          summary: "Text to speech (ElevenLabs)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TtsRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Audio MPEG",
              content: { "audio/mpeg": { schema: { type: "string", format: "binary" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/socket": {
        get: {
          tags: ["Realtime"],
          summary: "Socket.IO bootstrap URL",
          description: "Returns the WebSocket server URL for real-time notifications.",
          responses: {
            "200": {
              description: "Socket URL",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      url: { type: "string", example: "http://localhost:3001" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
    },
  };
}
