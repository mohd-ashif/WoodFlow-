export interface SetupStep {
  id: number;
  title: string;
  description: string;
  route: string;
  roleRequired: string;
  completedByDefault?: boolean;
}

export interface BusinessWorkflow {
  id: string;
  title: string;
  description: string;
  steps: Array<{
    step: number;
    title: string;
    description: string;
    module: string;
  }>;
}

export interface DocArticle {
  id: string;
  title: string;
  category: 'inventory' | 'crm' | 'sales' | 'purchases' | 'production' | 'finance' | 'reports' | 'settings';
  categoryLabel: string;
  summary: string;
  purpose: string;
  whenToUse: string[];
  quickActions: Array<{ label: string; route: string }>;
  steps: Array<{
    stepNumber: number;
    title: string;
    location: string;
    action: string;
    details: string;
  }>;
  whatHappensNext: string;
  whereItAppearsLater: string;
  tips?: string[];
  warnings?: string[];
  relatedArticleIds: string[];
}

export interface TaskGuide {
  id: string;
  title: string;
  summary: string;
  route: string;
  keywords: string[];
  category: string;
  steps: string[];
  nextSteps?: string;
}

export interface RoleGuide {
  role: string;
  roleTitle: string;
  description: string;
  primaryModules: string[];
  keyTasks: string[];
  recommendedDailyRoutine: string[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  relatedRoute?: string;
}

// ─── 1. RECOMMENDED SETUP CHECKLIST ──────────────────────────────────────────
export const SETUP_CHECKLIST: SetupStep[] = [
  {
    id: 1,
    title: 'Set up Company Details',
    description: 'Configure your furniture shop name, GST number, address, phone number, and logo.',
    route: '/settings/company',
    roleRequired: 'OWNER',
  },
  {
    id: 2,
    title: 'Add Users & Assign Roles',
    description: 'Invite your staff, accountants, and managers to the ERP with appropriate permissions.',
    route: '/settings/users',
    roleRequired: 'OWNER',
  },
  {
    id: 3,
    title: 'Set up Product Categories',
    description: 'Create categories like Living Room, Bedroom, Dining, Office, and Raw Materials.',
    route: '/inventory/categories',
    roleRequired: 'OWNER / MANAGER',
  },
  {
    id: 4,
    title: 'Set up Measurement Units',
    description: 'Define units like Pieces (Pcs), Sets, Meters (m), Kilograms (kg), and Feet (ft).',
    route: '/inventory/units',
    roleRequired: 'OWNER / MANAGER',
  },
  {
    id: 5,
    title: 'Add Products & Raw Materials',
    description: 'Add your furniture items and raw materials with cost prices, selling prices, and minimum stock alerts.',
    route: '/inventory/products',
    roleRequired: 'INVENTORY / MANAGER',
  },
  {
    id: 6,
    title: 'Add Customers',
    description: 'Create customer records with contact numbers, addresses, and GST details for billing.',
    route: '/crm/customers',
    roleRequired: 'SALES / MANAGER',
  },
  {
    id: 7,
    title: 'Add Suppliers',
    description: 'Record timber, hardware, fabric, and foam suppliers for purchase orders.',
    route: '/crm/suppliers',
    roleRequired: 'PURCHASE / MANAGER',
  },
  {
    id: 8,
    title: 'Configure Payment Accounts & Cash Modes',
    description: 'Add cash drawers, bank accounts, UPI scanners, and credit card accounts.',
    route: '/finance/accounts',
    roleRequired: 'ACCOUNTANT / OWNER',
  },
  {
    id: 9,
    title: 'Set Opening Inventory Stock',
    description: 'Record initial physical stock quantities for existing products before starting sales.',
    route: '/inventory/adjust',
    roleRequired: 'INVENTORY / OWNER',
  },
  {
    id: 10,
    title: 'Set Opening Cash & Bank Balances',
    description: 'Record starting cash and bank balances in finance accounts.',
    route: '/finance/accounts',
    roleRequired: 'ACCOUNTANT / OWNER',
  },
  {
    id: 11,
    title: 'Start Sales, Purchases & Production',
    description: 'You are ready! Create estimates, issue invoices, receive purchases, and track production.',
    route: '/dashboard',
    roleRequired: 'ALL USERS',
  },
];

// ─── 2. VISUAL BUSINESS WORKFLOWS ─────────────────────────────────────────────
export const BUSINESS_WORKFLOWS: BusinessWorkflow[] = [
  {
    id: 'sales-cycle',
    title: 'Sales & Invoicing Workflow',
    description: 'How a customer inquiry turns into a confirmed sale, generated invoice, and collected payment.',
    steps: [
      { step: 1, title: 'Customer Inquiry / Estimate', description: 'Create an estimate/quotation with prices and discounts for the customer.', module: 'Sales' },
      { step: 2, title: 'Confirm Sales Order', description: 'Convert estimate into a confirmed Sale Order when customer agrees.', module: 'Sales' },
      { step: 3, title: 'Generate Invoice', description: 'Issue a formal tax invoice with breakdown of furniture items and taxes.', module: 'Invoices' },
      { step: 4, title: 'Collect Customer Payment', description: 'Record payment received via Cash, Bank, UPI, or Cheque.', module: 'Finance' },
      { step: 5, title: 'Stock & Ledger Update', description: 'Inventory stock automatically decreases, and customer balance settles.', module: 'Reports' },
    ],
  },
  {
    id: 'purchase-cycle',
    title: 'Purchases & Procurement Workflow',
    description: 'How raw materials or goods are ordered from suppliers and added to inventory.',
    steps: [
      { step: 1, title: 'Purchase Order (PO)', description: 'Send purchase order to wood, fabric, or hardware supplier.', module: 'Purchases' },
      { step: 2, title: 'Receive Purchase & Bill', description: 'Mark items as received when goods arrive at warehouse.', module: 'Purchases' },
      { step: 3, title: 'Automatic Stock Increase', description: 'Received product stock is immediately added to inventory balance.', module: 'Inventory' },
      { step: 4, title: 'Record Supplier Payment', description: 'Pay supplier bill from cash or bank account.', module: 'Finance' },
    ],
  },
  {
    id: 'production-cycle',
    title: 'Furniture Production Workflow',
    description: 'How raw materials (timber, foam, fabric) are converted into finished furniture (sofas, tables, beds).',
    steps: [
      { step: 1, title: 'Create Work Order', description: 'Specify target furniture item (e.g. 5 Dining Sets) and deadline.', module: 'Work Orders' },
      { step: 2, title: 'Issue Raw Materials', description: 'Deduct timber, screws, and glue from raw material inventory.', module: 'Production' },
      { step: 3, title: 'Assign Workers', description: 'Assign carpenters, polishers, and upholsterers to tasks.', module: 'Workers' },
      { step: 4, title: 'Complete Production', description: 'Mark work order completed. Finished furniture stock is automatically increased.', module: 'Inventory' },
    ],
  },
  {
    id: 'accounting-cycle',
    title: 'Finance & Expense Workflow',
    description: 'How money coming in and going out is tracked to show accurate profit and cash flow.',
    steps: [
      { step: 1, title: 'Record Customer Payments', description: 'Money received increases Cash or Bank balance.', module: 'Finance' },
      { step: 2, title: 'Record Shop Expenses', description: 'Log rent, electricity, tea, worker wages, or maintenance expenses.', module: 'Expenses' },
      { step: 3, title: 'Track Receivables & Payables', description: 'Monitor pending customer dues and unpaid supplier bills.', module: 'Finance' },
      { step: 4, title: 'View Profit & Loss Report', description: 'Check real-time net income (Sales Revenue minus Purchases and Expenses).', module: 'Reports' },
    ],
  },
];

// ─── 3. MODULE DOCUMENTATION ARTICLES ─────────────────────────────────────────
export const MODULE_ARTICLES: DocArticle[] = [
  {
    id: 'products-guide',
    title: 'Managing Furniture Products & Raw Materials',
    category: 'inventory',
    categoryLabel: 'Inventory Management',
    summary: 'Maintain your complete catalog of finished furniture items and raw materials with cost prices, selling prices, and stock alerts.',
    purpose: 'Products are the core items your business buys, sells, or manufactures. Adding products lets the ERP automatically calculate invoice totals, track stock levels, and alert you when stock is running low.',
    whenToUse: [
      'Adding a new sofa, bed, chair, or dining table to your catalog',
      'Adding raw materials like timber, plywood, fabric, foam, or screws',
      'Updating selling prices or purchase costs',
      'Setting low stock alert thresholds',
    ],
    quickActions: [
      { label: 'View Products List', route: '/inventory/products' },
      { label: '+ Add New Product', route: '/inventory/products/new' },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Open Products Catalog',
        location: 'Sidebar → Inventory → Products',
        action: 'Click the "+ Add Product" button at the top right.',
        details: 'You can also search or filter existing products using the search bar.',
      },
      {
        stepNumber: 2,
        title: 'Fill Basic Information',
        location: 'Product Form',
        action: 'Enter Product Name, unique SKU code, Category, and Measurement Unit.',
        details: 'For example: Name = "Teak Dining Chair 4-Seater", SKU = "CHR-TK-004", Category = "Dining Room".',
      },
      {
        stepNumber: 3,
        title: 'Set Prices and Stock Alerts',
        location: 'Pricing Section',
        action: 'Enter Purchase Price (Cost), Selling Price, Minimum Stock Alert, and Opening Stock quantity.',
        details: 'When stock drops below Minimum Stock, the ERP displays a yellow alert banner on your dashboard.',
      },
      {
        stepNumber: 4,
        title: 'Save Product',
        location: 'Bottom Action Bar',
        action: 'Click "Save Product".',
        details: 'The item is instantly saved and available for sales, purchase orders, and stock movements.',
      },
    ],
    whatHappensNext: 'The product will immediately appear in your Product Catalog, Sales Invoice dropdowns, and Low Stock monitoring reports.',
    whereItAppearsLater: 'Product names and SKUs appear in Sales Orders, Invoices, Purchase Bills, Inventory Reports, and Production Work Orders.',
    tips: [
      'Use unique SKU codes (e.g. SF-3SEAT-TEAK) to quickly scan or search products during sales.',
      'Assign correct units (Pcs vs Meters vs Sets) so stock calculations remain precise.',
    ],
    warnings: [
      'Deactivating a product hides it from new sales, but preserves all historical sales invoices for accounting safety.',
    ],
    relatedArticleIds: ['categories-units-guide', 'stock-adjustments-guide', 'low-stock-guide'],
  },
  {
    id: 'sales-invoicing-guide',
    title: 'Creating Sales Orders & Customer Invoices',
    category: 'sales',
    categoryLabel: 'Sales & Invoicing',
    summary: 'Issue quotation estimates, record customer sales orders, generate tax invoices, and collect payments.',
    purpose: 'Sales & Invoicing records revenue, calculates GST tax, reduces product inventory stock, and tracks customer payment dues.',
    whenToUse: [
      'Creating a price quotation for a customer',
      'Selling furniture items to walk-in or wholesale customers',
      'Generating printable bills/invoices with GST',
      'Tracking unpaid customer receivables',
    ],
    quickActions: [
      { label: 'View Sales Orders', route: '/sales' },
      { label: '+ Create New Sale', route: '/sales/new' },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Start New Sale',
        location: 'Sidebar → Sales & Invoicing → Sales Orders',
        action: 'Click "+ Create Sale".',
        details: 'Select an existing customer or choose "Walk-in Customer".',
      },
      {
        stepNumber: 2,
        title: 'Add Furniture Line Items',
        location: 'Items Table',
        action: 'Select products, enter quantities, unit prices, and discounts.',
        details: 'Subtotal, taxes, and net invoice amount calculate automatically.',
      },
      {
        stepNumber: 3,
        title: 'Confirm Sale & Generate Invoice',
        location: 'Action Bar',
        action: 'Click "Confirm Sale".',
        details: 'This reserves/deducts stock from inventory and creates a printable tax invoice.',
      },
      {
        stepNumber: 4,
        title: 'Record Payment (Optional)',
        location: 'Payment Modal',
        action: 'Select payment mode (Cash, UPI, Bank) and enter amount received.',
        details: 'If fully paid, status changes to PAID; otherwise, remaining amount stays in Customer Dues.',
      },
    ],
    whatHappensNext: 'Stock decreases immediately, payment enters your Cash/Bank balance, and the sale is recorded in Sales Reports.',
    whereItAppearsLater: 'Customer Payment History, Executive Dashboard, Profit & Loss Report, and Stock Movement Logs.',
    tips: [
      'Print or download PDF invoices directly from the invoice detail screen to hand to customers.',
    ],
    warnings: [
      'Cancelling a confirmed sale restores product stock back to inventory and logs a stock reversal.',
    ],
    relatedArticleIds: ['products-guide', 'finance-payments-guide', 'customers-guide'],
  },
  {
    id: 'purchases-guide',
    title: 'Recording Supplier Purchases & Inventory Stock-In',
    category: 'purchases',
    categoryLabel: 'Purchases & Procurement',
    summary: 'Order raw materials or finished stock from suppliers, receive goods into warehouse, and manage payables.',
    purpose: 'Purchases track money spent on stock and automatically increase physical product stock upon receipt.',
    whenToUse: [
      'Ordering timber, fabric, foam, or hardware from suppliers',
      'Receiving stock shipments into inventory',
      'Tracking supplier bills and payment due dates',
    ],
    quickActions: [
      { label: 'View Purchase Orders', route: '/purchases' },
      { label: '+ New Purchase Order', route: '/purchases/new' },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Create Purchase Order',
        location: 'Sidebar → Purchases → Purchase Orders',
        action: 'Click "+ New Purchase Order". Select supplier.',
        details: 'Enter reference number or bill number from supplier invoice.',
      },
      {
        stepNumber: 2,
        title: 'Add Received Items',
        location: 'Purchase Line Items',
        action: 'Select products/materials, quantities, and cost prices.',
        details: 'Verify unit cost against supplier bill.',
      },
      {
        stepNumber: 3,
        title: 'Receive Order',
        location: 'Status Action',
        action: 'Click "Mark Received".',
        details: 'Inventory stock quantities increase immediately for all line items.',
      },
    ],
    whatHappensNext: 'Physical stock levels rise in inventory, and supplier bill balance enters your Payables list.',
    whereItAppearsLater: 'Inventory Reports, Supplier Payables, Cash Flow Reports, and Supplier Ledger.',
    tips: ['Keep supplier invoice reference numbers entered for easy tax audit reconciliation.'],
    relatedArticleIds: ['products-guide', 'suppliers-guide', 'finance-payments-guide'],
  },
  {
    id: 'production-guide',
    title: 'Furniture Production & Work Orders',
    category: 'production',
    categoryLabel: 'Production & Work Orders',
    summary: 'Manage workshop manufacturing orders, consume raw materials, assign carpenters, and output finished furniture.',
    purpose: 'Production Work Orders track manufacturing jobs, ensuring raw materials are consumed accurately and finished stock is produced on time.',
    whenToUse: [
      'Starting a workshop job for sofas, beds, or custom furniture',
      'Deducting raw materials (wood, fabric, glue) used during manufacturing',
      'Assigning daily tasks to carpenters or workers',
      'Tracking production status (Carpentry → Upholstery → Polishing → Completed)',
    ],
    quickActions: [
      { label: 'View Work Orders', route: '/work-orders' },
      { label: 'Worker Directory', route: '/workers' },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Create Work Order',
        location: 'Sidebar → Production → Work Orders',
        action: 'Click "+ Create Work Order". Select target furniture product and quantity.',
        details: 'Example: Target = "3-Seater Leather Sofa", Quantity = 5 Pcs.',
      },
      {
        stepNumber: 2,
        title: 'Assign Planned Raw Materials',
        location: 'Materials Section',
        action: 'Select raw materials required (e.g. 50 Sq Ft Leather, 10 Mtr Timber).',
        details: 'Clicking "Issue Materials" deducts raw materials from inventory.',
      },
      {
        stepNumber: 3,
        title: 'Assign Workers',
        location: 'Tasks Section',
        action: 'Assign tasks to carpenters or polishers.',
        details: 'Workers can view their assigned jobs in the "My Work" portal.',
      },
      {
        stepNumber: 4,
        title: 'Complete Work Order',
        location: 'Status Toggle',
        action: 'Mark Work Order as COMPLETED.',
        details: 'Finished furniture stock is automatically added to finished goods inventory!',
      },
    ],
    whatHappensNext: 'Raw material stock decreases and finished furniture stock increases in real time.',
    whereItAppearsLater: 'Stock Movement History, Inventory Dashboard, Production Reports, Worker Activity.',
    relatedArticleIds: ['products-guide', 'stock-adjustments-guide'],
  },
  {
    id: 'finance-accounting-guide',
    title: 'Finance, Accounts, Expenses & Cash Flow',
    category: 'finance',
    categoryLabel: 'Finance & Accounting',
    summary: 'Track shop cash drawers, bank accounts, business expenses, customer receivables, and supplier payables.',
    purpose: 'Finance gives you complete visibility over liquid cash, pending debts, daily operational expenses, and overall business cash flow.',
    whenToUse: [
      'Checking cash drawer or bank balance',
      'Recording daily shop expenses (rent, tea, wages, electricity)',
      'Checking money customers owe you (Receivables)',
      'Checking money you owe suppliers (Payables)',
      'Transferring funds between bank and cash account',
    ],
    quickActions: [
      { label: 'Payment Accounts', route: '/finance/accounts' },
      { label: 'Customer Receivables', route: '/finance/receivables' },
      { label: 'Supplier Payables', route: '/finance/payables' },
      { label: 'Shop Expenses', route: '/finance/expenses' },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Record Daily Expense',
        location: 'Sidebar → Finance → Expenses',
        action: 'Click "+ Add Expense". Enter Title, Category, Amount, and Payment Account.',
        details: 'Example: Title = "Workshop Electricity Bill", Amount = ₹4,500, Account = "HDFC Bank".',
      },
      {
        stepNumber: 2,
        title: 'Track Customer Dues',
        location: 'Sidebar → Finance → Receivables',
        action: 'View list of customers with pending invoice balances.',
        details: 'Click "Record Payment" when customer pays pending amount.',
      },
      {
        stepNumber: 3,
        title: 'View Account Ledger',
        location: 'Sidebar → Finance → Accounts',
        action: 'Click on any Payment Account (Cash / Bank) to view chronological transactions.',
        details: 'Shows all credit (money in) and debit (money out) transactions with running balances.',
      },
    ],
    whatHappensNext: 'Account balances update instantly and feed into Cash Flow and Profit & Loss reports.',
    whereItAppearsLater: 'Financial Transactions Ledger, Business Overview Reports, Executive KPI Dashboard.',
    relatedArticleIds: ['sales-invoicing-guide', 'purchases-guide'],
  },
  {
    id: 'reports-guide',
    title: 'Understanding Business & Executive Reports',
    category: 'reports',
    categoryLabel: 'Reports & Analytics',
    summary: 'Analyze business growth, sales trends, stock valuation, supplier payments, and net profit.',
    purpose: 'Reports synthesize your daily transactions into actionable business intelligence for decision making.',
    whenToUse: [
      'Reviewing daily, weekly, or monthly sales revenue',
      'Checking total inventory asset valuation',
      'Comparing current period sales against preceding periods',
      'Exporting CSV or PDF reports for tax accountants',
    ],
    quickActions: [
      { label: 'Business Overview', route: '/reports' },
      { label: 'Sales Reports', route: '/reports/sales' },
      { label: 'Inventory Valuation', route: '/reports/inventory' },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Open Reports Center',
        location: 'Sidebar → Reports & Analytics',
        action: 'Select desired report tab (Sales, Inventory, Finance, Production, Expenses).',
        details: 'Use date preset filters (Today, Yesterday, This Month, This Year) at top.',
      },
      {
        stepNumber: 2,
        title: 'Interpret KPI Cards',
        location: 'Top Summary Bar',
        action: 'Review Total Sales, Total Purchases, Expenses, Net Cash Flow, and Growth % badges.',
        details: 'Green percentage badges indicate growth compared to the preceding equivalent period.',
      },
      {
        stepNumber: 3,
        title: 'Export Report',
        location: 'Top Right Header Action',
        action: 'Click "Export CSV" or "Export PDF".',
        details: 'Downloads formatted spreadsheet file for accounting or auditing records.',
      },
    ],
    whatHappensNext: 'Provides clear insights to optimize pricing, reorder fast-selling stock, and reduce shop expenses.',
    whereItAppearsLater: 'Executive Dashboard summary cards, Monthly Profit & Loss statements, Tax Audit exports.',
    relatedArticleIds: ['finance-accounting-guide', 'sales-invoicing-guide'],
  },
];

// ─── 4. TASK-BASED GUIDES ─────────────────────────────────────────────────────
export const TASK_GUIDES: TaskGuide[] = [
  {
    id: 'how-to-add-product',
    title: 'How to Add a New Product or Raw Material',
    summary: 'Add furniture items or raw materials with prices, SKUs, and stock alert levels.',
    route: '/inventory/products/new',
    category: 'Inventory',
    keywords: ['add product', 'create product', 'new product', 'item', 'raw material', 'furniture'],
    steps: [
      'Go to Inventory → Products.',
      'Click "+ Add Product" at top right.',
      'Enter Product Name, SKU, Category, Unit, Cost Price, and Selling Price.',
      'Set Minimum Stock quantity for low-stock alerts.',
      'Click "Save Product".',
    ],
    nextSteps: 'Product is instantly ready to be used in Sales, Purchases, and Stock Movements.',
  },
  {
    id: 'how-to-create-invoice',
    title: 'How to Create a Sales Invoice',
    summary: 'Issue a tax invoice for a customer sale and calculate total GST.',
    route: '/sales/new',
    category: 'Sales',
    keywords: ['create invoice', 'make bill', 'new sale', 'invoice', 'billing', 'customer sale'],
    steps: [
      'Go to Sales → Sales Orders.',
      'Click "+ Create Sale". Select Customer or Walk-in.',
      'Add products, enter quantities and unit prices.',
      'Click "Confirm Sale".',
      'Click "Print Invoice" to download PDF or print.',
    ],
    nextSteps: 'Stock is deducted from inventory and payment balance is updated.',
  },
  {
    id: 'how-to-record-payment',
    title: 'How to Record Customer Payment',
    summary: 'Log payment received from a customer against an open invoice.',
    route: '/finance/receivables',
    category: 'Finance',
    keywords: ['record payment', 'customer payment', 'collect money', 'due payment', 'pay bill'],
    steps: [
      'Go to Finance → Receivables (or Sales → Invoices).',
      'Find the customer or invoice with due amount.',
      'Click "Record Payment".',
      'Choose Payment Account (Cash / Bank / UPI) and enter amount.',
      'Click "Save Payment".',
    ],
    nextSteps: 'Customer outstanding balance reduces, and Cash/Bank account balance increases.',
  },
  {
    id: 'how-to-check-stock',
    title: 'How to Check Inventory Stock Levels',
    summary: 'View current physical stock quantities and low-stock alerts.',
    route: '/inventory',
    category: 'Inventory',
    keywords: ['check stock', 'stock level', 'inventory count', 'low stock', 'stock search'],
    steps: [
      'Go to Inventory → Overview (or Inventory → Products).',
      'Use the search bar to search by product name or SKU.',
      'Check the "Stock Qty" column for real-time counts.',
      'Check "Low Stock" tab for items below minimum threshold.',
    ],
  },
  {
    id: 'how-to-record-expense',
    title: 'How to Record Shop Expense',
    summary: 'Log shop operational expenses like rent, tea, wages, or electricity.',
    route: '/finance/expenses',
    category: 'Finance',
    keywords: ['record expense', 'add expense', 'shop cost', 'bills', 'rent', 'electricity'],
    steps: [
      'Go to Finance → Expenses.',
      'Click "+ Add Expense".',
      'Enter Title, Category (e.g. Rent, Utilities), Amount, and Payment Mode.',
      'Click "Save Expense".',
    ],
    nextSteps: 'Expense is logged and deducted from cash flow in Profit & Loss reports.',
  },
  {
    id: 'how-to-create-work-order',
    title: 'How to Create Production Work Order',
    summary: 'Start a manufacturing job for furniture items in the workshop.',
    route: '/work-orders',
    category: 'Production',
    keywords: ['work order', 'production job', 'manufacture', 'workshop', 'furniture creation'],
    steps: [
      'Go to Production → Work Orders.',
      'Click "+ Create Work Order".',
      'Select target furniture product and target completion date.',
      'Issue required raw materials from stock.',
      'Assign tasks to carpenters/workers.',
    ],
    nextSteps: 'Work order appears in worker schedules. Completing it adds finished stock to inventory.',
  },
  {
    id: 'how-to-view-profit',
    title: 'How to View Business Profit & Loss',
    summary: 'Check monthly revenue, gross margins, and net profit.',
    route: '/reports',
    category: 'Reports',
    keywords: ['view profit', 'profit and loss', 'net margin', 'income', 'business revenue', 'earnings'],
    steps: [
      'Go to Reports & Analytics → Business Overview.',
      'Select date range (e.g. This Month or This Year).',
      'Review Total Sales, Total Expenses, and Net Margin calculation.',
    ],
  },
];

// ─── 5. ROLE-BASED GUIDES ─────────────────────────────────────────────────────
export const ROLE_GUIDES: RoleGuide[] = [
  {
    role: 'OWNER',
    roleTitle: 'Business Owner / Administrator',
    description: 'Full system control. Focuses on executive performance, company settings, team access, and profit analysis.',
    primaryModules: ['Reports & Analytics', 'Company Settings', 'Finance & Accounting', 'User Management'],
    keyTasks: [
      'Monitor daily sales and net cash flow on Executive Dashboard',
      'Manage user permissions and company profile settings',
      'Review Profit & Loss, Receivables, and Payables weekly',
      'Approve access requests and monitor audit logs',
    ],
    recommendedDailyRoutine: [
      '9:00 AM: Check Executive Overview KPI summary and cash drawer balances.',
      '1:00 PM: Review low-stock alerts and approve urgent purchase orders.',
      '6:00 PM: Check total daily sales revenue and customer payments collected.',
    ],
  },
  {
    role: 'SALES_STAFF',
    roleTitle: 'Sales Executive / Billing Clerk',
    description: 'Manages customer interactions, price quotations, sales orders, invoices, and payment collection.',
    primaryModules: ['Sales Orders', 'Invoices', 'Customers (CRM)', 'Receivables'],
    keyTasks: [
      'Create customer price estimates/quotations',
      'Issue confirmed sales orders and print tax invoices',
      'Collect payments via Cash, UPI, or Bank',
      'Add new customer contacts with phone and address',
    ],
    recommendedDailyRoutine: [
      'Check pending customer estimates and follow up on orders.',
      'Issue sales invoices for walk-in and wholesale deliveries.',
      'Record all received cash/UPI payments before end of day.',
    ],
  },
  {
    role: 'INVENTORY_MANAGER',
    roleTitle: 'Warehouse / Stock Manager',
    description: 'Maintains product catalog, monitors stock levels, logs stock adjustments, and receives purchases.',
    primaryModules: ['Products Database', 'Stock Movements', 'Low Stock Alerts', 'Purchases'],
    keyTasks: [
      'Add new products and raw materials with SKUs',
      'Verify physical stock against ERP numbers during stock counts',
      'Receive incoming purchase shipments from suppliers',
      'Reorder items appearing on Low Stock alert lists',
    ],
    recommendedDailyRoutine: [
      'Check Low Stock and Out of Stock alerts every morning.',
      'Verify received goods against supplier purchase orders.',
      'Log stock adjustments for damaged or sample items.',
    ],
  },
  {
    role: 'ACCOUNTANT',
    roleTitle: 'Accountant / Finance Specialist',
    description: 'Manages financial accounts, shop expenses, supplier payables, customer receivables, and ledgers.',
    primaryModules: ['Payment Accounts', 'Expenses', 'Receivables & Payables', 'Reports & Ledgers'],
    keyTasks: [
      'Record daily shop expenses and categorize bills',
      'Track supplier payment due dates and issue payments',
      'Reconcile cash drawer and bank statements',
      'Export financial reports for quarterly GST filing',
    ],
    recommendedDailyRoutine: [
      'Review pending supplier payables and schedule payments.',
      'Record all operational expense vouchers.',
      'Reconcile Cash Account against actual physical drawer cash.',
    ],
  },
  {
    role: 'PRODUCTION_STAFF',
    roleTitle: 'Production Manager / Workshop Foreman',
    description: 'Oversees workshop manufacturing, work orders, raw material consumption, and worker job allocation.',
    primaryModules: ['Work Orders', 'Worker Directory', 'My Work Portal', 'Raw Material Consumption'],
    keyTasks: [
      'Create work orders for furniture manufacturing',
      'Issue raw materials (timber, foam, fabric) to workshop floor',
      'Assign tasks to carpenters and polishers',
      'Mark completed work orders to release finished goods to inventory',
    ],
    recommendedDailyRoutine: [
      'Check active work order progress and deadline status.',
      'Ensure carpenters have required raw materials issued.',
      'Mark completed furniture jobs to update finished stock.',
    ],
  },
];

// ─── 6. ERP GLOSSARY ──────────────────────────────────────────────────────────
export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'SKU (Stock Keeping Unit)',
    definition: 'A unique alphanumeric code assigned to each product (e.g. CHR-TK-001) for fast searching and tracking.',
    example: 'SF-3SEAT-TEAK for a Teak 3-Seater Sofa.',
  },
  {
    term: 'Invoice',
    definition: 'An official tax document issued to a customer detailing furniture items sold, prices, GST taxes, and final payable amount.',
  },
  {
    term: 'Estimate / Quotation',
    definition: 'A preliminary price quotation given to a customer before they decide to buy. It does not deduct stock until converted to a Sale.',
  },
  {
    term: 'Sales Order',
    definition: 'A confirmed customer order that reserves inventory stock and leads to billing.',
  },
  {
    term: 'Purchase Order (PO)',
    definition: 'An official order sent to a supplier specifying materials or goods you wish to purchase.',
  },
  {
    term: 'Receivable (Customer Dues)',
    definition: 'Money that customers owe your business for furniture items delivered but not yet fully paid.',
    example: 'If an invoice is ₹50,000 and customer paid ₹30,000, Receivable is ₹20,000.',
  },
  {
    term: 'Payable (Supplier Dues)',
    definition: 'Money your business owes to suppliers for timber, hardware, or materials received.',
  },
  {
    term: 'Ledger',
    definition: 'A chronological financial record showing all money coming in (credits) and going out (debits) for an account.',
  },
  {
    term: 'Stock Movement',
    definition: 'Any increase or decrease in product stock caused by a sale, purchase, production work order, or manual adjustment.',
  },
  {
    term: 'Opening Stock',
    definition: 'The initial physical quantity of a product present in your shop before using the ERP for daily operations.',
  },
  {
    term: 'Opening Balance',
    definition: 'The starting cash or bank balance present in an account when setting up the ERP.',
  },
  {
    term: 'Gross Profit',
    definition: 'Total sales revenue minus the cost of goods sold (COGS), before deducting shop operational expenses.',
  },
  {
    term: 'Net Profit',
    definition: 'The final money remaining after deducting all purchases, wages, rent, electricity, and shop expenses from sales revenue.',
  },
  {
    term: 'Work Order',
    definition: 'A workshop job instruction to produce a specific quantity of finished furniture items.',
  },
  {
    term: 'Raw Material',
    definition: 'Basic materials (wood, timber, screws, fabric, foam, varnish) used in manufacturing finished furniture.',
  },
];

// ─── 7. FREQUENTLY ASKED QUESTIONS (FAQ) ──────────────────────────────────────
export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I add a new furniture product or material?',
    answer: 'Go to Inventory → Products and click "+ Add Product". Enter Name, SKU, Category, Cost Price, Selling Price, and click Save.',
    category: 'Inventory',
    relatedRoute: '/inventory/products/new',
  },
  {
    id: 'faq-2',
    question: 'Why did my product stock decrease automatically?',
    answer: 'Product stock automatically decreases whenever a Sales Order is confirmed or an Invoice is issued for that product.',
    category: 'Inventory',
  },
  {
    id: 'faq-3',
    question: 'How do I increase stock when new goods arrive from a supplier?',
    answer: 'Go to Purchases → Purchase Orders, create a purchase order, add line items, and click "Mark Received". Stock increases automatically upon receipt.',
    category: 'Purchases',
    relatedRoute: '/purchases/new',
  },
  {
    id: 'faq-4',
    question: 'How do I record a payment received from a customer?',
    answer: 'Go to Finance → Receivables (or Sales → Invoices), find the customer/invoice, click "Record Payment", select Cash/Bank/UPI account, and save.',
    category: 'Finance',
    relatedRoute: '/finance/receivables',
  },
  {
    id: 'faq-5',
    question: 'What is the difference between an Estimate and an Invoice?',
    answer: 'An Estimate is a price quote given before a sale and does not deduct stock. An Invoice is a formal bill issued after a sale that reduces inventory stock and records revenue.',
    category: 'Sales',
  },
  {
    id: 'faq-6',
    question: 'How do I log daily shop expenses like rent or electricity?',
    answer: 'Go to Finance → Expenses, click "+ Add Expense", enter Title, Amount, Category (Rent, Utilities, Wages), and select the payment mode.',
    category: 'Finance',
    relatedRoute: '/finance/expenses',
  },
  {
    id: 'faq-7',
    question: 'How does workshop production affect inventory stock?',
    answer: 'Issuing raw materials for a Work Order reduces raw material stock (timber, foam). Completing the Work Order automatically increases finished furniture stock (sofas, tables).',
    category: 'Production',
    relatedRoute: '/work-orders',
  },
  {
    id: 'faq-8',
    question: 'Can I export reports for my tax accountant?',
    answer: 'Yes! Go to Reports & Analytics, select Sales, Inventory, or Finance report, and click "Export CSV" or "Export PDF" at top right.',
    category: 'Reports',
    relatedRoute: '/reports',
  },
  {
    id: 'faq-9',
    question: 'How do I change user permissions or add new staff?',
    answer: 'Company Owners can go to Settings → Users to invite staff members and assign roles (Manager, Sales Staff, Accountant, Worker).',
    category: 'Settings',
    relatedRoute: '/settings/users',
  },
  {
    id: 'faq-10',
    question: 'What should I do if physical stock count does not match ERP stock?',
    answer: 'Go to Inventory → Overview and click "Adjust Stock". Select the product, enter reason (e.g. Damaged, Correction), and enter the corrected stock quantity.',
    category: 'Inventory',
    relatedRoute: '/inventory/adjust',
  },
];
