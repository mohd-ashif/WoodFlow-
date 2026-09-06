import { masterDataResolverService } from '../apps/api/src/modules/imports/services/master-data-resolver.service.js';

async function runTests() {
  console.log('🧪 Starting Smart Import Engine & MasterDataResolver Tests...\n');

  // Test 1: Normalization function
  console.log('1. Testing normalizeMasterName...');
  const testCases = [
    { input: 'Wooden Furniture', expected: 'wooden furniture' },
    { input: '  wooden   furniture  ', expected: 'wooden furniture' },
    { input: 'WOODEN FURNITURE', expected: 'wooden furniture' },
    { input: 'Piece', expected: 'piece' },
    { input: '   PIECE   ', expected: 'piece' },
    { input: '', expected: '' },
    { input: undefined, expected: '' }
  ];

  for (const tc of testCases) {
    const norm = masterDataResolverService.normalizeMasterName(tc.input);
    if (norm !== tc.expected) {
      throw new Error(`Normalization failed for "${tc.input}": expected "${tc.expected}", got "${norm}"`);
    }
  }
  console.log('   ✅ Normalization tests passed.');

  // Test 2: Clean Display Name function
  console.log('\n2. Testing cleanDisplayName...');
  const displayCases = [
    { input: '  Wooden   Furniture ', expected: 'Wooden Furniture' },
    { input: '   Outdoor   Furniture  ', expected: 'Outdoor Furniture' },
    { input: ' Running   Feet ', expected: 'Running Feet' }
  ];

  for (const dc of displayCases) {
    const clean = masterDataResolverService.cleanDisplayName(dc.input);
    if (clean !== dc.expected) {
      throw new Error(`cleanDisplayName failed for "${dc.input}": expected "${dc.expected}", got "${clean}"`);
    }
  }
  console.log('   ✅ Clean display name tests passed.');

  // Test 3: Short Code Derivation
  console.log('\n3. Testing deriveShortCode...');
  const codeCases = [
    { input: 'Running Feet', expected: 'RF' },
    { input: 'Square Meter', expected: 'SM' },
    { input: 'Piece', expected: 'Piec' },
    { input: 'Box', expected: 'Box' }
  ];

  for (const cc of codeCases) {
    const code = masterDataResolverService.deriveShortCode(cc.input);
    if (code !== cc.expected) {
      throw new Error(`deriveShortCode failed for "${cc.input}": expected "${cc.expected}", got "${code}"`);
    }
  }
  console.log('   ✅ Short code derivation tests passed.');

  // Test 4: Mock Bulk Category Resolution (Read-Only Preview Mode)
  console.log('\n4. Testing bulkResolveCategories in read-only preview mode...');
  const mockDbClient = {
    category: {
      findMany: async ({ where }: any) => [
        { id: 'cat_15', name: 'Wooden Furniture' },
        { id: 'cat_18', name: 'Chairs' }
      ]
    },
    unit: {
      findMany: async ({ where }: any) => [
        { id: 'unit_1', name: 'Piece', shortCode: 'Pcs' }
      ]
    }
  };

  const rawCategories = ['Wooden Furniture', 'wooden furniture', '  WOODEN   FURNITURE ', 'Outdoor Furniture', 'Outdoor Furniture'];
  const resPreview = await masterDataResolverService.bulkResolveCategories(
    mockDbClient,
    'comp_123',
    rawCategories,
    true // isReadonlyPreview
  );

  console.log('   Preview Category Summary:', resPreview.summary);
  if (resPreview.summary.existingCount !== 1) {
    throw new Error(`Expected 1 existing category ("Wooden Furniture"), got ${resPreview.summary.existingCount}`);
  }
  if (resPreview.summary.toCreateCount !== 1) {
    throw new Error(`Expected 1 category to create ("Outdoor Furniture"), got ${resPreview.summary.toCreateCount}`);
  }
  if (resPreview.summary.namesToCreate[0] !== 'Outdoor Furniture') {
    throw new Error(`Expected name to create "Outdoor Furniture", got "${resPreview.summary.namesToCreate[0]}"`);
  }

  // Check map lookup consistency
  const normExisting = masterDataResolverService.normalizeMasterName(' WOODEN  FURNITURE ');
  const matchedExisting = resPreview.map.get(normExisting);
  if (!matchedExisting || matchedExisting.id !== 'cat_15' || matchedExisting.created !== false) {
    throw new Error('Case-insensitive category matching failed on mock DB result!');
  }

  const normNew = masterDataResolverService.normalizeMasterName('Outdoor Furniture');
  const matchedNew = resPreview.map.get(normNew);
  if (!matchedNew || matchedNew.created !== true) {
    throw new Error('New category preview identification failed!');
  }
  console.log('   ✅ Read-only preview resolution tests passed.');

  console.log('\n🎉 ALL SMART IMPORT ENGINE UNIT TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('\n❌ Test failure:', err.message);
  process.exit(1);
});
