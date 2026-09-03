import { test, expect } from '../../fixtures/auth.fixture';
import { calculateExpectedAccountBalance } from '../../helpers/calculations';
import { APIRequestContext } from '@playwright/test';

test.describe('Multi-Account Financial Ledger & Accounts Suite @finance @calculation', () => {

  test('Query Payment Accounts & Record Operational Expense with Ledger Assertion', async ({ apiClientA }: { apiClientA: APIRequestContext }) => {
    // 1. Fetch available payment accounts (or create one if none exist)
    let accountsRes = await apiClientA.get('/finance/accounts');
    expect(accountsRes.status()).toBe(200);
    let body = await accountsRes.json();
    expect(body.success).toBe(true);

    let accounts = body.data?.accounts || body.data || [];
    if (accounts.length === 0) {
      const newAccRes = await apiClientA.post('/finance/accounts', {
        data: {
          name: 'Main Factory Cash Account',
          type: 'CASH',
          openingBalance: 10000.00,
        },
      });
      expect([200, 201]).toContain(newAccRes.status());
      accountsRes = await apiClientA.get('/finance/accounts');
      body = await accountsRes.json();
      accounts = body.data?.accounts || body.data || [];
    }

    let targetAccount = accounts.find((a: any) => Number(a.currentBalance || a.balance || 0) >= 500);

    if (!targetAccount) {
      const newAccRes = await apiClientA.post('/finance/accounts', {
        data: {
          name: `QA Cash Account ${Date.now()}`,
          type: 'CASH',
          openingBalance: 10000.00,
        },
      });
      expect([200, 201]).toContain(newAccRes.status());
      accountsRes = await apiClientA.get('/finance/accounts');
      body = await accountsRes.json();
      accounts = body.data?.accounts || body.data || [];
      targetAccount = accounts.find((a: any) => Number(a.currentBalance || a.balance || 0) >= 500) || accounts[0];
    }

    const initialBalance = Number(targetAccount.currentBalance || targetAccount.balance || 0);

    // 2. Record Operational Expense of ₹500
    const expenseAmount = 500.00;
    const expenseRes = await apiClientA.post('/finance/expenses', {
      data: {
        paymentAccountId: targetAccount.id,
        title: 'Factory Maintenance Expense',
        amount: expenseAmount,
        description: 'Automated QA Expense Log',
      },
    });

    expect([200, 201]).toContain(expenseRes.status());

    // 3. Independent Balance Calculation Assertion
    const expectedBalance = calculateExpectedAccountBalance({
      openingBalance: initialBalance,
      expenses: [expenseAmount],
    });

    const updatedAccountsRes = await apiClientA.get('/finance/accounts');
    const updatedBody = await updatedAccountsRes.json();
    const updatedAccounts = updatedBody.data?.accounts || updatedBody.data || [];
    const updatedAccount = updatedAccounts.find((a: any) => a.id === targetAccount.id);

    if (updatedAccount) {
      const actualBalance = Number(updatedAccount.currentBalance || updatedAccount.balance || 0);
      expect(actualBalance).toBeCloseTo(expectedBalance, 2);
    }
  });
});
