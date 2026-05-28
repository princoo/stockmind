import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  getPermissionsForRole,
  hasPermission,
  type AppPermission,
} from "@/lib/auth/permissions";
import type { Role } from "@/generated/prisma/enums";
import {
  createProductEntry,
  getProducts,
  removeProductEntry,
  updateProductEntry,
} from "@/server/products/service";
import {
  createCategoryEntry,
  getCategories,
  removeCategoryEntry,
  updateCategoryEntry,
} from "@/server/categories/service";
import {
  createSupplierEntry,
  getSuppliers,
  removeSupplierEntry,
  updateSupplierEntry,
} from "@/server/suppliers/service";
import { recordStockMovement } from "@/server/inventory/service";
import { getTransactions } from "@/server/transactions/service";
import { getActivityLogs } from "@/server/activity-logs/service";
import {
  getNotifications,
  markNotificationAsRead,
  markNotificationsAsRead,
} from "@/server/notifications/service";

type ToolActor = {
  userId: string;
  role: Role;
  userName?: string | null;
  userEmail?: string | null;
};

function deny(permission: AppPermission) {
  return `Access denied. Missing permission: ${permission}.`;
}

function assertPermission(actor: ToolActor, permission: AppPermission) {
  return hasPermission(actor.role, permission) ? null : deny(permission);
}

function resolveStockStatus(quantity: number, lowStockThreshold: number) {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

const checkInventorySchema = z.object({
  productId: z.string().trim().min(1).optional(),
  sku: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  availability: z.enum(["ALL", "AVAILABLE"]).default("ALL"),
  limit: z.number().int().min(1).max(50).default(25),
});

const listProductsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
  search: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  sortBy: z.enum(["name", "price", "quantity", "createdAt"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const createProductSchema = z.object({
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  categoryId: z.string().trim().min(1),
  supplierId: z.string().trim().min(1),
});

const updateProductSchema = createProductSchema.extend({
  id: z.string().trim().min(1),
});

const deleteByIdSchema = z.object({
  id: z.string().trim().min(1),
});

const listCategoriesSchema = z.object({
  search: z.string().trim().optional(),
});

const createCategorySchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().default(""),
});

const updateCategorySchema = createCategorySchema.extend({
  id: z.string().trim().min(1),
});

const listSuppliersSchema = z.object({
  search: z.string().trim().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
  sortBy: z.enum(["name", "createdAt"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const createSupplierSchema = z.object({
  name: z.string().trim().min(1),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateSupplierSchema = createSupplierSchema.extend({
  id: z.string().trim().min(1),
});

const stockMovementSchema = z.object({
  productId: z.string().trim().min(1),
  type: z.enum(["STOCK_IN", "STOCK_OUT"]),
  quantity: z.number().int().positive(),
});

const listTransactionsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(15),
  search: z.string().optional(),
  type: z.enum(["STOCK_IN", "STOCK_OUT"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["createdAt", "quantity"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const listActivityLogsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(15),
  search: z.string().optional(),
  action: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
  entity: z.enum(["PRODUCT", "CATEGORY", "SUPPLIER", "USER"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const listNotificationsSchema = z.object({
  limit: z.number().int().min(1).max(20).default(8),
});

const markNotificationReadSchema = z.object({
  notificationId: z.string().trim().min(1),
});

export function getInventoryTools(actor: ToolActor) {
  const getCurrentSessionContextTool = tool(
    async () => {
      const permissions = getPermissionsForRole(actor.role);
      return JSON.stringify({
        user: {
          id: actor.userId,
          name: actor.userName ?? null,
          email: actor.userEmail ?? null,
          role: actor.role,
        },
        permissions,
      });
    },
    {
      name: "getCurrentSessionContext",
      description:
        "Get current authenticated user identity, role, and allowed permissions.",
      schema: z.object({}),
    },
  );

  const checkInventoryTool = tool(
    async ({ productId, sku, search, limit, availability }) => {
      const permissionError = assertPermission(actor, "VIEW_INVENTORY");
      if (permissionError) return permissionError;

      const where: Prisma.ProductWhereInput = {};
      if (productId) where.id = productId;
      else if (sku) where.sku = sku;
      else if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ];
      }
      if (availability === "AVAILABLE") where.quantity = { gt: 0 };

      const [items, totalMatching] = await Promise.all([
        prisma.product.findMany({
          where,
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            lowStockThreshold: true,
            price: true,
            category: { select: { name: true } },
            supplier: { select: { name: true } },
          },
          orderBy: { name: "asc" },
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return JSON.stringify({
        products: items.map((item) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          lowStockThreshold: item.lowStockThreshold,
          status: resolveStockStatus(item.quantity, item.lowStockThreshold),
          price: Number(item.price),
          category: item.category.name,
          supplier: item.supplier.name,
        })),
        returned: items.length,
        totalMatching,
      });
    },
    {
      name: "checkInventory",
      description:
        "Read inventory products. For broad listing, omit productId/sku/search.",
      schema: checkInventorySchema,
    },
  );

  const getProductsTool = tool(
    async (input) => {
      const permissionError = assertPermission(actor, "VIEW_PRODUCTS");
      if (permissionError) return permissionError;
      const result = await getProducts(
        Object.fromEntries(
          Object.entries(input).flatMap(([k, v]) =>
            v === undefined ? [] : [[k, String(v)]],
          ),
        ),
      );
      return JSON.stringify(result);
    },
    {
      name: "getProducts",
      description: "List products with pagination/search/sort.",
      schema: listProductsSchema,
    },
  );

  const createProductTool = tool(
    async (input) => {
      const permissionError = assertPermission(actor, "MANAGE_PRODUCTS");
      if (permissionError) return permissionError;
      const created = await createProductEntry(input, actor.userId);
      return JSON.stringify(created);
    },
    {
      name: "createProduct",
      description: "Create a new product.",
      schema: createProductSchema,
    },
  );

  const updateProductTool = tool(
    async ({ id, ...payload }) => {
      const permissionError = assertPermission(actor, "MANAGE_PRODUCTS");
      if (permissionError) return permissionError;
      const updated = await updateProductEntry(id, payload, actor.userId);
      return JSON.stringify(updated);
    },
    {
      name: "updateProduct",
      description: "Update an existing product.",
      schema: updateProductSchema,
    },
  );

  const deleteProductTool = tool(
    async ({ id }) => {
      const permissionError = assertPermission(actor, "DELETE_PRODUCTS");
      if (permissionError) return permissionError;
      await removeProductEntry(id, actor.userId);
      return JSON.stringify({ ok: true });
    },
    {
      name: "deleteProduct",
      description: "Delete a product by id.",
      schema: deleteByIdSchema,
    },
  );

  const getCategoriesTool = tool(
    async ({ search }) => {
      const permissionError = assertPermission(actor, "VIEW_CATEGORIES");
      if (permissionError) return permissionError;
      const result = await getCategories(search ? { search } : {});
      return JSON.stringify(result);
    },
    {
      name: "getCategories",
      description: "List categories.",
      schema: listCategoriesSchema,
    },
  );

  const createCategoryTool = tool(
    async (input) => {
      const permissionError = assertPermission(actor, "MANAGE_CATEGORIES");
      if (permissionError) return permissionError;
      const created = await createCategoryEntry(input);
      return JSON.stringify(created);
    },
    {
      name: "createCategory",
      description: "Create a category.",
      schema: createCategorySchema,
    },
  );

  const updateCategoryTool = tool(
    async ({ id, ...payload }) => {
      const permissionError = assertPermission(actor, "UPDATE_CATEGORIES");
      if (permissionError) return permissionError;
      const updated = await updateCategoryEntry(id, payload);
      return JSON.stringify(updated);
    },
    {
      name: "updateCategory",
      description: "Update a category.",
      schema: updateCategorySchema,
    },
  );

  const deleteCategoryTool = tool(
    async ({ id }) => {
      const permissionError = assertPermission(actor, "MANAGE_CATEGORIES");
      if (permissionError) return permissionError;
      await removeCategoryEntry(id, actor.userId);
      return JSON.stringify({ ok: true });
    },
    {
      name: "deleteCategory",
      description: "Delete a category by id.",
      schema: deleteByIdSchema,
    },
  );

  const getSuppliersTool = tool(
    async (input) => {
      const permissionError = assertPermission(actor, "VIEW_SUPPLIERS");
      if (permissionError) return permissionError;
      const result = await getSuppliers(
        Object.fromEntries(
          Object.entries(input).flatMap(([k, v]) =>
            v === undefined ? [] : [[k, String(v)]],
          ),
        ),
      );
      return JSON.stringify(result);
    },
    {
      name: "getSuppliers",
      description: "List suppliers with pagination/search/sort.",
      schema: listSuppliersSchema,
    },
  );

  const createSupplierTool = tool(
    async (input) => {
      const permissionError = assertPermission(actor, "MANAGE_SUPPLIERS");
      if (permissionError) return permissionError;
      const created = await createSupplierEntry(input);
      return JSON.stringify(created);
    },
    {
      name: "createSupplier",
      description: "Create a supplier.",
      schema: createSupplierSchema,
    },
  );

  const updateSupplierTool = tool(
    async ({ id, ...payload }) => {
      const permissionError = assertPermission(actor, "MANAGE_SUPPLIERS");
      if (permissionError) return permissionError;
      const updated = await updateSupplierEntry(id, payload);
      return JSON.stringify(updated);
    },
    {
      name: "updateSupplier",
      description: "Update supplier details.",
      schema: updateSupplierSchema,
    },
  );

  const deleteSupplierTool = tool(
    async ({ id }) => {
      const permissionError = assertPermission(actor, "MANAGE_SUPPLIERS");
      if (permissionError) return permissionError;
      await removeSupplierEntry(id, actor.userId);
      return JSON.stringify({ ok: true });
    },
    {
      name: "deleteSupplier",
      description: "Delete a supplier by id.",
      schema: deleteByIdSchema,
    },
  );

  const updateStockTool = tool(
    async (input) => {
      const permissionError = assertPermission(actor, "OPERATE_STOCK");
      if (permissionError) return permissionError;
      const movement = await recordStockMovement(actor.userId, input);
      return JSON.stringify(movement);
    },
    {
      name: "updateStock",
      description:
        "Record stock movement via canonical inventory service (STOCK_IN/STOCK_OUT).",
      schema: stockMovementSchema,
    },
  );

  const getTransactionsTool = tool(
    async (input) => {
      const permissionError = assertPermission(actor, "VIEW_TRANSACTIONS");
      if (permissionError) return permissionError;
      const result = await getTransactions(
        Object.fromEntries(
          Object.entries(input).flatMap(([k, v]) =>
            v === undefined ? [] : [[k, String(v)]],
          ),
        ),
      );
      return JSON.stringify(result);
    },
    {
      name: "getTransactions",
      description: "List transactions with pagination/filters.",
      schema: listTransactionsSchema,
    },
  );

  const getActivityLogsTool = tool(
    async (input) => {
      const permissionError = assertPermission(actor, "VIEW_ACTIVITY_LOGS");
      if (permissionError) return permissionError;
      const result = await getActivityLogs(
        Object.fromEntries(
          Object.entries(input).flatMap(([k, v]) =>
            v === undefined ? [] : [[k, String(v)]],
          ),
        ),
      );
      return JSON.stringify(result);
    },
    {
      name: "getAuditLogs",
      description: "List audit logs with filters.",
      schema: listActivityLogsSchema,
    },
  );

  const getNotificationsTool = tool(
    async ({ limit }) => {
      const result = await getNotifications(actor.userId, limit);
      return JSON.stringify(result);
    },
    {
      name: "getNotifications",
      description: "Get notifications for current user.",
      schema: listNotificationsSchema,
    },
  );

  const markNotificationReadTool = tool(
    async ({ notificationId }) => {
      await markNotificationAsRead(actor.userId, notificationId);
      return JSON.stringify({ ok: true });
    },
    {
      name: "markNotificationRead",
      description: "Mark one notification as read for current user.",
      schema: markNotificationReadSchema,
    },
  );

  const markAllNotificationsReadTool = tool(
    async () => {
      await markNotificationsAsRead(actor.userId);
      return JSON.stringify({ ok: true });
    },
    {
      name: "markAllNotificationsRead",
      description: "Mark all notifications as read for current user.",
      schema: z.object({}),
    },
  );

  return [
    getCurrentSessionContextTool,
    checkInventoryTool,
    getProductsTool,
    createProductTool,
    updateProductTool,
    deleteProductTool,
    getCategoriesTool,
    createCategoryTool,
    updateCategoryTool,
    deleteCategoryTool,
    getSuppliersTool,
    createSupplierTool,
    updateSupplierTool,
    deleteSupplierTool,
    updateStockTool,
    getTransactionsTool,
    getActivityLogsTool,
    getNotificationsTool,
    markNotificationReadTool,
    markAllNotificationsReadTool,
  ];
}
