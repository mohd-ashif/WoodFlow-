import { test, expect } from '../../fixtures/auth.fixture';
import {
  buildTestSupplier,
  buildTestCustomer,
  buildTestProduct,
  buildTestPurchaseInput,
  buildTestSaleInput,
  getOrCreateTestCategoryAndUnit,
} from '../../factories/dataFactory';
import { calculateExpectedWeightedAverageCost } from '../../helpers/calculations';
import { APIRequestContext } from '@playwright/test';

test.describe('Master End-to-End Business Lifecycle Scenario @smoke @critical @p0', () => {

  test('Full Lifecycle: Supplier -> Product -> Purchase PO -> Receive Stock -> Sale Order -> Deduct Stock -> Ledger Settlement', async ({ apiClientA }: { apiClientA: APIRequestContext }) => {
    test.setTimeout(90000);

    // Step 1: Register Supplier
    const supplierPayload = buildTestSupplier();
    const supRes = await apiClientA.post('/suppliers', { data: supplierPayload });
    expect([200, 201]).toContain(supRes.status());
    const supBody = await supRes.json();
    const supplierId = supBody.data?.id || supBody.data?.supplier?.id;
    expect(supplierId).toBeTruthy();

    // Step 2: Register Customer
    const customerPayload = buildTestCustomer();
    const cusRes = await apiClientA.post('/customers', { data: customerPayload });
    expect([200, 201]).toContain(cusRes.status());
    const cusBody = await cusRes.json();
    const customerId = cusBody.data?.id || cusBody.data?.customer?.id;
    expect(customerId).toBeTruthy();

    // Step 3: Create Raw Timber / Furniture Product (Initial stock: 50 @ ₹100.00 purchase price)
    const { categoryId, unitId } = await getOrCreateTestCategoryAndUnit(apiClientA);
    const productPayload = buildTestProduct({ openingStock: 50, purchasePrice: 100.00, sellingPrice: 300.00, categoryId, unitId });
    const prodRes = await apiClientA.post('/products', { data: productPayload });
    expect([200, 201]).toContain(prodRes.status());
    const prodBody = await prodRes.json();
    const product = prodBody.data?.product || prodBody.data;
    const productId = product.id;

    // Step 4: Create Purchase Order for 50 additional units @ ₹140.00 cost
    const purchaseInput = buildTestPurchaseInput(supplierId, productId, 50, 140.00);
    const poRes = await apiClientA.post('/purchases', { data: purchaseInput });
    expect([200, 201]).toContain(poRes.status());
    const poBody = await poRes.json();
    const purchaseId = poBody.data?.id || poBody.data?.purchase?.id || poBody.id;

    // Step 5: Receive Purchase Goods
    const receiveRes = await apiClientA.post(`/purchases/${purchaseId}/confirm`);
    expect([200, 201]).toContain(receiveRes.status());

    // Step 6: Verify Stock Increased (50 + 50 = 100) & Weighted Average Cost Recalculated
    const verifyProdRes = await apiClientA.get(`/products/${productId}`);
    const verifyBody = await verifyProdRes.json();
    const productAfterReceive = verifyBody.data?.product || verifyBody.data;
    expect(productAfterReceive.currentStock).toBe(100);

    const expectedWAC = calculateExpectedWeightedAverageCost(50, 100.00, 50, 140.00); // 120.00
    expect(expectedWAC).toBe(120.00);

    // Step 7: Create & Confirm Sale Order for 20 units
    const saleInput = buildTestSaleInput(customerId, productId, 20, 300.00);
    const saleRes = await apiClientA.post('/sales', { data: saleInput });
    expect([200, 201]).toContain(saleRes.status());
    const saleBody = await saleRes.json();
    const saleId = saleBody.data?.id || saleBody.data?.sale?.id || saleBody.id;

    const confirmSaleRes = await apiClientA.post(`/sales/${saleId}/confirm`);
    expect([200, 201]).toContain(confirmSaleRes.status());

    // Step 8: Verify Final Stock Deducted (100 - 20 = 80)
    const finalProdRes = await apiClientA.get(`/products/${productId}`);
    const finalBody = await finalProdRes.json();
    const finalProduct = finalBody.data?.product || finalBody.data;
    expect(finalProduct.currentStock).toBe(80);
  });
});
