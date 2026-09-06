'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { TableCard, TableCardBody } from '../../../components/ui/TableCard';
import { Layers, Download, CheckCircle2, AlertOctagon, RefreshCw, FileText, Calendar } from 'lucide-react';
import toast from '../../../components/ui/Toast';

interface ImportJobHistoryItem {
  id: string;
  module: string;
  fileName: string;
  fileType: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  duplicateRows: number;
  status: 'UPLOADED' | 'VALIDATING' | 'READY' | 'IMPORTING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  createdAt: string;
  completedAt?: string;
  importedBy: string;
}

export default function ImportHistoryPage() {
  const [history, setHistory] = useState<ImportJobHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/imports/history`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHistory(data.data || []);
      }
    } catch {
      toast.error('Failed to load import history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const downloadErrorReport = (jobId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    window.open(`${apiUrl}/imports/${jobId}/errors`, '_blank');
  };

  return (
    <AppShell>
      <div className="h-full flex flex-col space-y-4 min-h-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 border-b border-border pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center space-x-2">
              <Layers className="w-6 h-6 text-primary" />
              <span>Universal Data Import History</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Audit logs and execution history for all bulk data migration jobs
            </p>
          </div>

          <button
            onClick={fetchHistory}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-lg border border-border transition-colors shadow-sm self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Log</span>
          </button>
        </div>

        {/* History Table */}
        <TableCard>
          {loading ? (
            <TableCardBody className="p-12 text-center text-muted-foreground flex items-center justify-center space-x-2 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              <span>Loading import history records...</span>
            </TableCardBody>
          ) : history.length === 0 ? (
            <TableCardBody className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-base font-semibold text-foreground">No import jobs recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">Use the "Import" button on any module page to migrate your Excel/CSV data.</p>
            </TableCardBody>
          ) : (
            <TableCardBody>
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md text-muted-foreground text-xs font-semibold uppercase border-b border-border/60">
                  <tr>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Imported By</th>
                    <th className="py-3 px-4 text-center">Total Rows</th>
                    <th className="py-3 px-4 text-center">Success</th>
                    <th className="py-3 px-4 text-center">Failed</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {history.map((job) => (
                    <tr key={job.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span>{job.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs text-primary uppercase">
                        {job.module}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{job.importedBy}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">{job.totalRows}</td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-500 font-bold">
                        {job.successfulRows}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-rose-500 font-bold">
                        {job.failedRows}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {job.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : job.status === 'PARTIAL' ? (
                          <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>Partial</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>{job.status}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {job.failedRows > 0 && (
                          <button
                            onClick={() => downloadErrorReport(job.id)}
                            className="inline-flex items-center space-x-1 text-xs text-rose-500 hover:text-rose-600 font-semibold px-2 py-1 bg-rose-500/10 rounded border border-rose-500/20 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>Error Log</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCardBody>
          )}
        </TableCard>
      </div>
    </AppShell>
  );
}

