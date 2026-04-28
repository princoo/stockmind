export type ProductStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type ProductListItem = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  status: ProductStatus;
};

export type ProductListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  sortBy: "name" | "price" | "quantity" | "createdAt";
  sortDir: "asc" | "desc";
};

export type ProductListResult = {
  items: ProductListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ProductPayload = {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  categoryId: string;
  supplierId: string;
};

export type ProductFormOption = {
  id: string;
  name: string;
};
