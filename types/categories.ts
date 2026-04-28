export type CategoryItem = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  productCount: number;
};

export type CategoryListResult = {
  items: CategoryItem[];
};

export type CategoryPayload = {
  name: string;
  description: string;
};
