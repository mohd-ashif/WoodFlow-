'use client';

import React, { useEffect, useState } from 'react';
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Layers className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Universal Data Import History</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit logs and execution history for all bulk data migration jobs
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading import history records...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No import jobs recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Use the "Import" button on any module page to migrate your Excel/CSV data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
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
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {history.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span>{job.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-xs text-indigo-600 dark:text-indigo-400 uppercase">
                      {job.module}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{job.importedBy}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold">{job.totalRows}</td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {job.successfulRows}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-rose-600 dark:text-rose-400 font-bold">
                      {job.failedRows}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {job.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      ) : job.status === 'PARTIAL' ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>Partial</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>{job.status}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {job.failedRows > 0 && (
                        <button
                          onClick={() => downloadErrorReport(job.id)}
                          className="inline-flex items-center space-x-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold px-2 py-1 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-800 transition-colors"
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
          </div>
        )}
      </div>
    </div>
  );
}
