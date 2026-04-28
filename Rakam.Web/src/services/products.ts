import { apiRequest } from "@/lib/api";
import type {
  Product,
  ProductDropdownItem,
  ListProductsDto,
  CreateProductDto,
  UpdateProductDto,
  ApiPaginatedResponse,
} from "@/types";

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export const productsService = {
  getProducts: (firmId: string, filters?: ListProductsDto): Promise<ApiPaginatedResponse<Product>> =>
    apiRequest(`/products${toQuery({ firmId, ...filters })}`),

  getProductsDropdown: (firmId: string): Promise<ProductDropdownItem[]> =>
    apiRequest(`/products/dropdown${toQuery({ firmId })}`),

  getProduct: (id: string): Promise<Product> =>
    apiRequest(`/products/${id}`),

  createProduct: (firmId: string, dto: CreateProductDto): Promise<Product> =>
    apiRequest(`/products${toQuery({ firmId })}`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateProduct: (id: string, dto: UpdateProductDto): Promise<Product> =>
    apiRequest(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  deleteProduct: (id: string): Promise<void> =>
    apiRequest(`/products/${id}`, { method: "DELETE" }),
};
