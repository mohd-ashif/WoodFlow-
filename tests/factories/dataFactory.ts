/**
 * Deterministic Test Data Factories for FurnitureOS Playwright E2E Tests.
 * Generates unique test payloads with timestamp prefixes to avoid cross-test pollution.
 */

export function generateUniqueId(prefix = 'E2E'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}`;
}

export function buildTestProduct(overrides = {}) {
  const uid = generateUniqueId('PROD');
  return {
    name: `Test Product ${uid}`,
    sku: `SKU-${uid}`,
    productType: 'FINISHED_PRODUCT',
    purchasePrice: 150.00,
    sellingPrice: 250.00,
    minimumStock: 10,
    openingStock: 100,
    description: 'QA Automated Test Product',
    ...overrides,
  };
}

export async function getOrCreateTestCategoryAndUnit(apiClient: any) {
  let categoryId: string | undefined;
  let unitId: string | undefined;

  const catRes = await apiClient.get('/categories');
  if (catRes.ok()) {
    const catBody = await catRes.json();
    const categories = catBody.data?.categories || catBody.data || [];
    if (categories.length > 0) {
      categoryId = categories[0].id;
    }
  }

  if (!categoryId) {
    const newCatRes = await apiClient.post('/categories', {
      data: { name: `Cat-${generateUniqueId()}`, description: 'QA Category' },
    });
    if (newCatRes.ok()) {
      const newCatBody = await newCatRes.json();
      categoryId = newCatBody.data?.id || newCatBody.data?.category?.id;
    }
  }

  const unitRes = await apiClient.get('/units');
  if (unitRes.ok()) {
    const unitBody = await unitRes.json();
    const units = unitBody.data?.units || unitBody.data || [];
    if (units.length > 0) {
      unitId = units[0].id;
    }
  }

  if (!unitId) {
    const newUnitRes = await apiClient.post('/units', {
      data: { name: `Piece-${generateUniqueId()}`, shortCode: `pcs-${generateUniqueId()}` },
    });
    if (newUnitRes.ok()) {
      const newUnitBody = await newUnitRes.json();
      unitId = newUnitBody.data?.id || newUnitBody.data?.unit?.id;
    }
  }

  return { categoryId, unitId };
}

export function buildTestCustomer(overrides = {}) {
  const uid = generateUniqueId('CUS');
  return {
    name: `Customer ${uid}`,
    phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
    email: `customer_${uid.toLowerCase()}@test.local`,
    gstNumber: '27ABCDE1234F1Z5',
    notes: 'QA Automated Test Customer',
    ...overrides,
  };
}

export function buildTestSupplier(overrides = {}) {
  const uid = generateUniqueId('SUP');
  return {
    name: `Supplier ${uid}`,
    phone: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
    email: `supplier_${uid.toLowerCase()}@test.local`,
    gstNumber: '27XYZAB9876C1Z3',
    notes: 'QA Automated Test Supplier',
    ...overrides,
  };
}

export function buildTestPurchaseInput(supplierId?: string, productId?: string, quantity = 50, unitCost = 120.00, overrides = {}) {
  return {
    supplierId,
    referenceNumber: `PO-${generateUniqueId()}`,
    notes: 'Automated Purchase Order Test',
    discountAmount: 0,
    taxRate: 18,
    items: [
      {
        productId,
        quantity,
        unitCost,
        discountAmount: 0,
        taxRate: 18,
      },
    ],
    ...overrides,
  };
}

export function buildTestSaleInput(customerId?: string, productId?: string, quantity = 10, unitPrice = 250.00, overrides = {}) {
  return {
    customerId,
    notes: 'Automated Sale Order Test',
    discountAmount: 0,
    taxRate: 18,
    items: [
      {
        productId,
        quantity,
        unitPrice,
        discountAmount: 0,
        taxRate: 18,
      },
    ],
    ...overrides,
  };
}
