import { test, expect } from '../../fixtures/auth.fixture';
import { buildTestProduct, getOrCreateTestCategoryAndUnit } from '../../factories/dataFactory';
import { APIRequestContext } from '@playwright/test';

test.describe('Product Catalog CRUD & Constraints Suite @smoke @crud', () => {

  test('Create new valid Product with opening stock', async ({ apiClientA }: { apiClientA: APIRequestContext }) => {
    const { categoryId, unitId } = await getOrCreateTestCategoryAndUnit(apiClientA);
    const productPayload = buildTestProduct({ categoryId, unitId });

    const createRes = await apiClientA.post('/products', { data: productPayload });
    expect([200, 201]).toContain(createRes.status());
    const body = await createRes.json();
    expect(body.success).toBe(true);

    const product = body.data?.product || body.data;
    expect(product.sku).toBe(productPayload.sku);
    expect(product.name).toBe(productPayload.name);
    expect(Number(product.sellingPrice)).toBe(productPayload.sellingPrice);
  });

  test('Duplicate SKU within same company is rejected', async ({ apiClientA }: { apiClientA: APIRequestContext }) => {
    const { categoryId, unitId } = await getOrCreateTestCategoryAndUnit(apiClientA);
    const productPayload = buildTestProduct({ categoryId, unitId });

    // 1. Create initial product
    const res1 = await apiClientA.post('/products', { data: productPayload });
    expect([200, 201]).toContain(res1.status());

    // 2. Attempt duplicate creation with same SKU
    const res2 = await apiClientA.post('/products', { data: productPayload });
    expect([400, 409]).toContain(res2.status());
    const body2 = await res2.json();
    expect(body2.success).toBe(false);
  });

  test('List products with pagination & search filter', async ({ apiClientA }: { apiClientA: APIRequestContext }) => {
    const { categoryId, unitId } = await getOrCreateTestCategoryAndUnit(apiClientA);
    const productPayload = buildTestProduct({ name: 'Searchable Teak Table', categoryId, unitId });
    await apiClientA.post('/products', { data: productPayload });

    const listRes = await apiClientA.get('/products?search=Searchable&page=1&limit=10');
    expect(listRes.status()).toBe(200);
    const body = await listRes.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
