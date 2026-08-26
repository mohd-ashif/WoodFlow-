import { fetchApi } from '../lib/api';
import {
  ProductSummary,
  CategorySummary,
  UnitSummary,
  InventorySummary,
  StockMovementSummary,
  InventoryDashboardStats,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateUnitInput,
  UpdateUnitInput,
  StockAdjustmentInput,
} from '@furniture-os/shared';

export const inventoryService = {
  // Products
  async getProducts(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<ProductSummary[]>(`/products${queryString}`);
  },

  async getProductById(id: string) {
    return fetchApi<{ product: ProductSummary; movements: StockMovementSummary[] }>(`/products/${id}`);
  },

  async createProduct(data: CreateProductInput) {
    return fetchApi<{ product: ProductSummary }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id: string, data: UpdateProductInput) {
    return fetchApi<{ product: ProductSummary }>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deactivateProduct(id: string) {
    return fetchApi<{ product: ProductSummary }>(`/products/${id}/deactivate`, {
      method: 'POST',
    });
  },

  async activateProduct(id: string) {
    return fetchApi<{ product: ProductSummary }>(`/products/${id}/activate`, {
      method: 'POST',
    });
  },

  // Categories
  async getCategories(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<{ categories: CategorySummary[] }>(`/categories${queryString}`);
  },

  async createCategory(data: CreateCategoryInput) {
    return fetchApi<{ category: CategorySummary }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCategory(id: string, data: UpdateCategoryInput) {
    return fetchApi<{ category: CategorySummary }>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deactivateCategory(id: string) {
    return fetchApi<{ category: CategorySummary }>(`/categories/${id}/deactivate`, {
      method: 'POST',
    });
  },

  // Units
  async getUnits(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<{ units: UnitSummary[] }>(`/units${queryString}`);
  },

  async createUnit(data: CreateUnitInput) {
    return fetchApi<{ unit: UnitSummary }>('/units', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUnit(id: string, data: UpdateUnitInput) {
    return fetchApi<{ unit: UnitSummary }>(`/units/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deactivateUnit(id: string) {
    return fetchApi<{ unit: UnitSummary }>(`/units/${id}/deactivate`, {
      method: 'POST',
    });
  },

  // Inventory & Stock Movements
  async getDashboardStats() {
    return fetchApi<InventoryDashboardStats>('/inventory');
  },

  async getLowStock(page = 1, limit = 20) {
    return fetchApi<ProductSummary[]>(`/inventory/low-stock?page=${page}&limit=${limit}`);
  },

  async getOutOfStock(page = 1, limit = 20) {
    return fetchApi<ProductSummary[]>(`/inventory/out-of-stock?page=${page}&limit=${limit}`);
  },

  async getProductInventory(productId: string) {
    return fetchApi<InventorySummary>(`/inventory/${productId}`);
  },

  async adjustStock(data: StockAdjustmentInput) {
    return fetchApi<{ updatedInventory: InventorySummary; movement: StockMovementSummary }>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getStockMovements(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<StockMovementSummary[]>(`/inventory/movements${queryString}`);
  },
};
