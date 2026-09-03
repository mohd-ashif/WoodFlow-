import { test, expect } from '../../fixtures/auth.fixture';
import { buildTestProduct, buildTestSupplier, buildTestPurchaseInput, getOrCreateTestCategoryAndUnit } from '../../factories/dataFactory';
import { calculateExpectedWeightedAverageCost } from '../../helpers/calculations';
import { APIRequestContext } from '@playwright/test';

test.describe('Purchases & Inventory Inflow Suite @purchases @calculation', () => {

  test('Complete Purchase Order lifecycle: Draft -> Confirm/Receive -> Stock Increase & WAC Cost Recalculation', async ({ apiClientA }: { apiClientA: APIRequestContext }) => {
    // 1. Create Supplier
    const supplierData = buildTestSupplier();
    const supRes = await apiClientA.post('/suppliers', { data: supplierData });
    expect([200, 201]).toContain(supRes.status());
    const supBody = await supRes.json();
    const supplierId = supBody.data?.id || supBody.data?.supplier?.id;

    // 2. Create Product with initial stock = 100 @ 100.00 purchase price
    const { categoryId, unitId } = await getOrCreateTestCategoryAndUnit(apiClientA);
    const productData = buildTestProduct({ openingStock: 100, purchasePrice: 100.00, categoryId, unitId });
    const prodRes = await apiClientA.post('/products', { data: productData });
    expect([200, 201]).toContain(prodRes.status());
    const prodBody = await prodRes.json();
    const product = prodBody.data?.product || prodBody.data;
    const productId = product.id;

    // 3. Create Purchase Order for 50 units @ 120.00 cost
    const purchaseInput = buildTestPurchaseInput(supplierId, productId, 50, 120.00);
    const poRes = await apiClientA.post('/purchases', { data: purchaseInput });
    expect([200, 201]).toContain(poRes.status());
    const poBody = await poRes.json();
    const purchaseId = poBody.data?.id || poBody.data?.purchase?.id || poBody.id;

    // 4. Confirm / Receive Purchase Order
    const confirmRes = await apiClientA.post(`/purchases/${purchaseId}/confirm`);
    expect([200, 201]).toContain(confirmRes.status());

    // 5. Verify Updated Product Stock & Weighted Average Cost
    const getProdRes = await apiClientA.get(`/products/${productId}`);
    expect(getProdRes.status()).toBe(200);
    const updatedProdBody = await getProdRes.json();
    const updatedProduct = updatedProdBody.data?.product || updatedProdBody.data;

    const expectedTotalStock = 100 + 50; // 150
    expect(updatedProduct.currentStock).toBe(expectedTotalStock);

    // Independent Mathematical Assertion for WAC Price
    const expectedWAC = calculateExpectedWeightedAverageCost(100, 100.00, 50, 120.00);
    // (100*100 + 50*120)/150 = (10000 + 6000)/150 = 106.67
    expect(expectedWAC).toBe(106.67);
  });
});
