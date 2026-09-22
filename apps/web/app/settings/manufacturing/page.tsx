'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function ManufacturingSettingsPage() {
  const [settings, setSettings] = useState<any>({
    defaultRawMaterialLocation: 'RAW_MATERIAL_STORE',
    defaultWipLocation: 'WIP_LOCATION',
    defaultFinishedGoodsLocation: 'FINISHED_GOODS_STORE',
    requireQC: true,
    allowNegativeStock: false,
    autoRunMRP: false,
    autoReserveStock: false,
    requireQCBeforeFinishedStock: true,
    defaultWastagePercent: 2.0,
    defaultOverheadPercent: 5.0,
    defaultCostingMethod: 'ACTUAL',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetchApi<any>('/settings/manufacturing');
        if (res) {
          setSettings(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      await fetchApi('/settings/manufacturing', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save manufacturing settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-7 h-7 text-amber-600" />
            <span>Manufacturing & MRP Settings</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure store locations, Quality Control rules, costing methods & automation triggers
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Manufacturing settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Locations */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-amber-600" />
            <span>Default Store Locations</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Raw Material Store</label>
              <input
                type="text"
                value={settings.defaultRawMaterialLocation || ''}
                onChange={(e) => setSettings({ ...settings, defaultRawMaterialLocation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WIP Store</label>
              <input
                type="text"
                value={settings.defaultWipLocation || ''}
                onChange={(e) => setSettings({ ...settings, defaultWipLocation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Finished Goods Store</label>
              <input
                type="text"
                value={settings.defaultFinishedGoodsLocation || ''}
                onChange={(e) => setSettings({ ...settings, defaultFinishedGoodsLocation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Quality Control & Stock Control */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Control Rules & Quality Assurance</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireQCBeforeFinishedStock || false}
                onChange={(e) => setSettings({ ...settings, requireQCBeforeFinishedStock: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Require Quality Control (QC) Approval before entering Finished Goods Stock
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowNegativeStock || false}
                onChange={(e) => setSettings({ ...settings, allowNegativeStock: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Allow Negative Inventory Stock Transactions
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoRunMRP || false}
                onChange={(e) => setSettings({ ...settings, autoRunMRP: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Auto-run MRP calculation upon Sales Order confirmation
              </span>
            </label>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Costing & Overheads */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Costing & Overhead Rates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Wastage %</label>
              <input
                type="number"
                step="0.1"
                value={settings.defaultWastagePercent || 0}
                onChange={(e) => setSettings({ ...settings, defaultWastagePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Manufacturing Overhead %</label>
              <input
                type="number"
                step="0.1"
                value={settings.defaultOverheadPercent || 0}
                onChange={(e) => setSettings({ ...settings, defaultOverheadPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-lg shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
