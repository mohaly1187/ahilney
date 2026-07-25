import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import Badge from '../components/Badge';

const TYPES = ['Payout', 'Commission', 'Refund', 'Refund Issued', 'Payment', 'Top-Up'];

export default function Financials() {
  const [filterType, setFilterType] = useState('');

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => api.stats() });
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filterType],
    queryFn: () => api.transactions(filterType || undefined),
  });

  const exportCSV = () => {
    if (!transactions || !transactions.length) return;
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Status', 'Entity', 'Method'];
    const rows = transactions.map(t => [
      t.id, 
      new Date(t.date).toISOString(), 
      t.type, 
      t.amount, 
      t.status, 
      t.entity_name || t.provider_name || t.patient_name || '', 
      t.method
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Ledger</h1>
          <p className="text-slate-500 mt-1">System-wide transactions, payouts, and revenue tracking.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-teal-50 px-5 py-3 rounded-xl border border-teal-100">
          <div>
            <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Total Platform Revenue</div>
            <div className="text-2xl font-bold text-teal-900">{stats?.total_revenue ? `EGP ${stats.total_revenue.toLocaleString()}` : '...'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white min-w-[200px]"
        >
          <option value="">All Transaction Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <button 
          onClick={exportCSV}
          disabled={!transactions?.length}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Transaction ID / Date</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Entity</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Loading ledger...</td>
                </tr>
              ) : transactions?.length > 0 ? (
                transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-400 font-mono mb-1">{txn.id}</div>
                      <div className="text-slate-700 whitespace-nowrap">
                        {new Date(txn.date).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{txn.type}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {txn.entity_name || txn.provider_name || txn.patient_name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs text-slate-600">
                        {txn.method || 'Internal'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={txn.status} />
                    </td>
                    <td className={`px-6 py-4 font-bold text-right whitespace-nowrap ${
                      ['Commission', 'Payment', 'Top-Up'].includes(txn.type) ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {['Commission', 'Payment', 'Top-Up'].includes(txn.type) ? '+' : ''}{txn.amount} EGP
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">No transactions found for the selected type.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
