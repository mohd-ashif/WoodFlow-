import { test, expect } from '../../fixtures/auth.fixture';
import { buildTestProduct, buildTestCustomer, buildTestSaleInput, getOrCreateTestCategoryAndUnit } from '../../factories/dataFactory';
import { APIRequestContext } from '@playwright/test';

test.describe('Sales Orders & Stock Deduction Suite @sales @calculation', () => {

  test('Create & Confirm Sale Order deducts stock; Cancellation restores stock', async ({ apiClientA }: { apiClientA: APIRequestContext }) => {
    // 1. Create Customer
    const customerData = buildTestCustomer();
    const cusRes = await apiClientA.post('/customers', { data: customerData });
    const cusBody = await cusRes.json();
    const customerId = cusBody.data?.id || cusBody.data?.customer?.id;

    // 2. Create Product with initial stock = 100
    const initialStock = 100;
    const { categoryId, unitId } = await getOrCreateTestCategoryAndUnit(apiClientA);
    const productData = buildTestProduct({ openingStock: initialStock, categoryId, unitId });
    const prodRes = await apiClientA.post('/products', { data: productData });
    const prodBody = await prodRes.json();
    const product = prodBody.data?.product || prodBody.data;
    const productId = product.id;

    // 3. Create Sale Order for 15 units
    const saleQty = 15;
    const saleInput = buildTestSaleInput(customerId, productId, saleQty, 250.00);
    const saleRes = await apiClientA.post('/sales', { data: saleInput });
    expect([200, 201]).toContain(saleRes.status());
    const saleBody = await saleRes.json();
    const saleId = saleBody.data?.id || saleBody.data?.sale?.id || saleBody.id;

    // 4. Confirm Sale Order
    const confirmRes = await apiClientA.post(`/sales/${saleId}/confirm`);
    expect([200, 201]).toContain(confirmRes.status());

    // 5. Assert Stock Deducted: 100 - 15 = 85
    const getProdRes1 = await apiClientA.get(`/products/${productId}`);
    const updatedBody1 = await getProdRes1.json();
    const updatedProd1 = updatedBody1.data?.product || updatedBody1.data;
    expect(updatedProd1.currentStock).toBe(initialStock - saleQty);

    // 6. Cancel Sale Order
    const cancelRes = await apiClientA.post(`/sales/${saleId}/cancel`, {
      data: { reason: 'QA Automated Cancellation Test' },
    });
    expect([200, 201]).toContain(cancelRes.status());

    // 7. Assert Stock Restored back to 100
    const getProdRes2 = await apiClientA.get(`/products/${productId}`);
    const updatedBody2 = await getProdRes2.json();
    const updatedProd2 = updatedBody2.data?.product || updatedBody2.data;
    expect(updatedProd2.currentStock).toBe(initialStock);
  });
});
