import { fetchApi } from '../lib/api';

export const analyticsService = {
  async getExecutiveOverview(params?: { startDate?: string; endDate?: string; preset?: string }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.preset) query.set('preset', params.preset);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/analytics/overview${queryString}`);
  },

  async getSalesReports(params?: { startDate?: string; endDate?: string; preset?: string }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.preset) query.set('preset', params.preset);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/analytics/sales${queryString}`);
  },

  async getInventoryReports(): Promise<any> {
    return fetchApi('/analytics/inventory');
  },

  async getPurchaseReports(params?: { startDate?: string; endDate?: string; preset?: string }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.preset) query.set('preset', params.preset);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/analytics/purchases${queryString}`);
  },

  async getCustomerAnalytics(): Promise<any> {
    return fetchApi('/analytics/customers');
  },

  async getSupplierAnalytics(): Promise<any> {
    return fetchApi('/analytics/suppliers');
  },

  async getFinanceReports(params?: { startDate?: string; endDate?: string; preset?: string }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.preset) query.set('preset', params.preset);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/analytics/finance${queryString}`);
  },

  async getExpenseReports(params?: { startDate?: string; endDate?: string; preset?: string }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.preset) query.set('preset', params.preset);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/analytics/expenses${queryString}`);
  },

  async getProductionReports(): Promise<any> {
    return fetchApi('/analytics/production');
  },

  async downloadReport(
    reportType: string,
    format: 'csv' | 'excel' | 'pdf' = 'csv',
    params?: { startDate?: string; endDate?: string; preset?: string }
  ): Promise<void> {
    const query = new URLSearchParams();
    query.set('reportType', reportType);
    query.set('format', format);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.preset) query.set('preset', params.preset);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const url = `${API_BASE}/analytics/export?${query.toString()}`;

    if (format === 'pdf') {
      window.open(url, '_blank');
      return;
    }

    const res = await fetch(url, {
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to download report as ${format.toUpperCase()}`);
    }

    const blob = await res.blob();
    const nowStr = new Date().toISOString().split('T')[0];
    const ext = format === 'excel' ? 'xls' : 'csv';
    const filename = `${reportType}-report-${nowStr}.${ext}`;

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async downloadReportCsv(reportType: string, params?: { startDate?: string; endDate?: string; preset?: string }): Promise<void> {
    return this.downloadReport(reportType, 'csv', params);
  },
};
