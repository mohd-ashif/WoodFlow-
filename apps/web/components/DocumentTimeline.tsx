'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  FileText,
  PackageCheck,
  Truck,
  DollarSign,
  AlertCircle,
  Factory,
  ShoppingBag,
  Palette,
  ClipboardList,
  Boxes,
} from 'lucide-react';
import { traceabilityService, TimelineNode } from '../services/traceabilityService';

interface DocumentTimelineProps {
  entityType: string;
  entityId: string;
}

export function DocumentTimeline({ entityType, entityId }: DocumentTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTimeline() {
      try {
        setLoading(true);
        const data = await traceabilityService.getDocumentTimeline(entityType, entityId);
        setTimeline(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load document timeline');
      } finally {
        setLoading(false);
      }
    }
    if (entityId) {
      loadTimeline();
    }
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Loading ERP Traceability Flow...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg">
        No linked transactions recorded for this item yet.
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'CUSTOMER':
        return <ClipboardList className="w-5 h-5 text-blue-600" />;
      case 'CUSTOMER_DESIGN':
        return <Palette className="w-5 h-5 text-purple-600" />;
      case 'QUOTATION':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'SALES_ORDER':
        return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
      case 'DEMAND':
      case 'MRP':
        return <Boxes className="w-5 h-5 text-amber-600" />;
      case 'WORK_ORDER':
      case 'PRODUCTION_OUTPUT':
        return <Factory className="w-5 h-5 text-orange-600" />;
      case 'QUALITY_CHECK':
        return <PackageCheck className="w-5 h-5 text-teal-600" />;
      case 'DELIVERY':
        return <Truck className="w-5 h-5 text-cyan-600" />;
      case 'INVOICE':
      case 'PAYMENT':
        return <DollarSign className="w-5 h-5 text-emerald-700" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center space-x-2">
        <Clock className="w-5 h-5 text-amber-600" />
        <span>End-to-End ERP Traceability Timeline</span>
      </h3>

      <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
        {timeline.map((node, index) => (
          <div key={node.id + index} className="relative pl-6">
            <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm">
              {getIcon(node.type)}
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">
                    {node.link ? (
                      <Link href={node.link} className="hover:underline text-blue-600">
                        {node.title}
                      </Link>
                    ) : (
                      node.title
                    )}
                  </h4>
                  {node.subtitle && <p className="text-xs text-slate-600 mt-1">{node.subtitle}</p>}
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-200 text-slate-800">
                  {node.status}
                </span>
              </div>

              <div className="mt-2 text-xs text-slate-400">
                {new Date(node.timestamp).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
