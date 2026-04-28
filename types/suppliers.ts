export type SupplierStatus = "ACTIVE" | "INACTIVE";

export type SupplierItem = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: SupplierStatus;
  productCount: number;
  createdAt: string;
};

export type SupplierListQuery = {
  search?: string;
  page: number;
  pageSize: number;
  sortBy: "name" | "createdAt";
  sortDir: "asc" | "desc";
};

export type SupplierListResult = {
  items: SupplierItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SupplierPayload = {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
};
