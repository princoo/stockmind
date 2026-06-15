import { z } from "zod";
import { tool } from "@langchain/core/tools";
import {
  getPermissionsForRole,
  hasPermission,
  type AppPermission,
} from "@/lib/auth/permissions";
import type { Role } from "@/generated/prisma/enums";
import {
  createProductEntry,
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
  removeSupplierEntry,
  updateSupplierEntry,
} from "@/server/suppliers/service";
import { recordStockMovement } from "@/server/inventory/service";
import {
  fetchActivityLogsForAssistant,
  fetchInventoryProductsForAssistant,
  fetchNotificationsForAssistant,
  fetchProductsForAssistant,
  fetchSuppliersForAssistant,
  fetchTransactionsForAssistant,
} from "@/server/ai/assistant-list-queries";
import {
  buildAiToolListPayload,
  stringifyAiToolList,
} from "@/server/ai/tool-list-response";
import {
  markNotificationAsRead,
  markNotificationsAsRead,
} from "@/server/notifications/service";
import { registerChatDownload } from "@/server/ai/chat-downloads";
import {
  buildProductsSpreadsheet,
  type ProductExportScope,
} from "@/server/exports/product-spreadsheet";
import type { ChatDownloadOffer } from "@/lib/chat-download";

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

const checkInventorySchema = z.object({
  productId: z.string().trim().min(1).optional(),
  sku: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  availability: z.enum(["ALL", "AVAILABLE"]).default("ALL"),
});

const listProductsSchema = z.object({
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
  search: z.string().optional(),
  type: z.enum(["STOCK_IN", "STOCK_OUT"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["createdAt", "quantity"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const listActivityLogsSchema = z.object({
  search: z.string().optional(),
  action: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
  entity: z.enum(["PRODUCT", "CATEGORY", "SUPPLIER", "USER"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const listNotificationsSchema = z.object({});

const markNotificationReadSchema = z.object({
  notificationId: z.string().trim().min(1),
});

const exportProductsSpreadsheetSchema = z.object({
  scope: z.enum(["all", "low_stock", "available"]).default("all"),
  search: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
});

export type InventoryToolHooks = {
  onChatDownload?: (download: ChatDownloadOffer) => void;
};

export function getInventoryTools(
  actor: ToolActor,
  hooks?: InventoryToolHooks,
) {
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
    async (input) => {
      const permissionError = assertPermission(actor, "VIEW_INVENTORY");
      if (permissionError) return permissionError;

      const { items, total } = await fetchInventoryProductsForAssistant(input);
      return stringifyAiToolList(items, total);
    },
    {
      name: "checkInventory",
      description:
        "Read inventory products. Returns the full matching set (not paginated). For broad listing, omit productId/sku/search.",
      schema: checkInventorySchema,
    },
  );

  const getProductsTool = tool(
    async (input) => {
      const permissionError = assertPermission(actor, "VIEW_PRODUCTS");
      if (permissionError) return permissionError;
      const { items, total } = await fetchProductsForAssistant(input);
      return stringifyAiToolList(items, total);
    },
    {
      name: "getProducts",
      description:
        "List products with optional search, category, and sort filters. Returns the full matching set (not paginated).",
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
      return stringifyAiToolList(result.items, result.items.length);
    },
    {
      name: "getCategories",
      description: "List all matching categories (not paginated).",
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
      const { items, total } = await fetchSuppliersForAssistant(input);
      return stringifyAiToolList(items, total);
    },
    {
      name: "getSuppliers",
      description:
        "List suppliers with optional search and sort. Returns the full matching set (not paginated).",
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
      const { items, total } = await fetchTransactionsForAssistant(input);
      return stringifyAiToolList(items, total);
    },
    {
      name: "getTransactions",
      description:
        "List transactions with optional filters. Returns the full matching set (not paginated).",
      schema: listTransactionsSchema,
    },
  );

  const getActivityLogsTool = tool(
    async (input) => {
      const permissionError = assertPermission(actor, "VIEW_ACTIVITY_LOGS");
      if (permissionError) return permissionError;
      const { items, total } = await fetchActivityLogsForAssistant(input);
      return stringifyAiToolList(items, total);
    },
    {
      name: "getAuditLogs",
      description:
        "List audit logs with optional filters. Returns the full matching set (not paginated).",
      schema: listActivityLogsSchema,
    },
  );

  const getNotificationsTool = tool(
    async () => {
      const { items, total, unreadCount } =
        await fetchNotificationsForAssistant(actor.userId);
      return JSON.stringify({
        ...buildAiToolListPayload(items, total),
        unreadCount,
      });
    },
    {
      name: "getNotifications",
      description:
        "Get all notifications for the current user (not paginated).",
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

  const exportProductsSpreadsheetTool = tool(
    async ({ scope, search, categoryId }) => {
      const permissionError = assertPermission(actor, "VIEW_PRODUCTS");
      if (permissionError) return permissionError;

      const { buffer, rowCount, filename } = await buildProductsSpreadsheet({
        scope: scope as ProductExportScope,
        search,
        categoryId,
      });

      if (rowCount === 0) {
        return JSON.stringify({
          ok: false,
          message: "No products matched the export filters.",
        });
      }

      const token = registerChatDownload({
        userId: actor.userId,
        buffer,
        filename,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const download: ChatDownloadOffer = {
        url: `/api/chat/downloads/${token}`,
        filename,
        label: `Download ${filename}`,
      };
      hooks?.onChatDownload?.(download);

      return JSON.stringify({
        ok: true,
        productCount: rowCount,
        filename,
        scope,
        downloadUrl: download.url,
        message:
          "Excel export is ready. Tell the user to use the download button shown in the StockPilot UI.",
      });
    },
    {
      name: "exportProductsSpreadsheet",
      description:
        "Generate an Excel (.xlsx) export of products for download. Use when the user asks for a spreadsheet, Excel file, or downloadable product list. Supports scope all, low_stock, or available, plus optional search and categoryId filters.",
      schema: exportProductsSpreadsheetSchema,
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
    exportProductsSpreadsheetTool,
  ];
}
