import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useToast } from '../components/ToastContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

const STATUSES = ['active', 'pending', 'review', 'interview', 'contract', 'rejected'];

export default function Providers() {
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [selectedProviderId, setSelectedProviderId] = useState(null);

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers', filterType, filterStatus, debouncedSearch],
    queryFn: () => api.providers({ 
      type: filterType || undefined, 
      status: filterStatus || undefined, 
      search: debouncedSearch || undefined 
    }),
  });

  const { data: providerDetails } = useQuery({
    queryKey: ['provider', selectedProviderId],
    queryFn: () => api.provider(selectedProviderId),
    enabled: !!selectedProviderId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.setProviderStatus(id, status),
    onSuccess: () => {
      addToast('Provider status updated');
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      if (selectedProviderId) queryClient.invalidateQueries({ queryKey: ['provider', selectedProviderId] });
    },
    onError: (err) => addToast(err.message || 'Failed to update status', 'error')
  });

  const docStatusMutation = useMutation({
    mutationFn: ({ providerId, docId, status }) => api.setDocumentStatus(providerId, docId, status),
    onSuccess: () => {
      addToast('Document status updated');
      queryClient.invalidateQueries({ queryKey: ['provider', selectedProviderId] });
    },
    onError: (err) => addToast(err.message || 'Failed to update document', 'error')
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Providers</h1>
        <p className="text-slate-500 mt-1">Manage doctors and rehabilitation specialists (RS) in the network.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <input 
            type="text" 
            placeholder="Search providers by name, email, phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white"
        >
          <option value="">All Types</option>
          <option value="Doctor">Doctor</option>
          <option value="RS">RS (Rehab Specialist)</option>
        </select>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Provider</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Type / Specialty</th>
                <th className="px-6 py-4 font-semibold">Regions Covered</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Loading providers...</td>
                </tr>
              ) : providers?.length > 0 ? (
                providers.map(provider => (
                  <tr key={provider.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{provider.name}</div>
                      <div className="text-xs text-slate-500">ID: {provider.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{provider.email}</div>
                      <div className="text-slate-500">{provider.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 mb-1">
                        {provider.type}
                      </div>
                      <div className="text-xs text-slate-500">{provider.specialty}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {provider.regions_covered?.slice(0, 2).map((r, i) => (
                          <span key={i} className="text-xs bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-100">{r}</span>
                        ))}
                        {provider.regions_covered?.length > 2 && (
                          <span className="text-xs text-slate-400">+{provider.regions_covered.length - 2} more</span>
                        )}
                        {!provider.regions_covered?.length && <span className="text-slate-400 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={provider.status}
                        onChange={(e) => statusMutation.mutate({ id: provider.id, status: e.target.value })}
                        disabled={statusMutation.isPending && statusMutation.variables?.id === provider.id}
                        className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white w-28 disabled:opacity-50"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedProviderId(provider.id)}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium hover:underline"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">No providers found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        title={providerDetails ? `Provider Profile: ${providerDetails.name}` : 'Loading Profile...'} 
        isOpen={!!selectedProviderId} 
        onClose={() => setSelectedProviderId(null)}
      >
        {providerDetails ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Contact Details</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{providerDetails.email}</p>
                <p className="text-sm text-slate-600">{providerDetails.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Role Details</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{providerDetails.type} — {providerDetails.specialty}</p>
                <p className="text-sm text-slate-600">Base Price: {providerDetails.price} EGP</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Financials</p>
                <p className="mt-1 text-sm font-medium text-teal-700">Wallet: {providerDetails.wallet_balance} EGP</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Status</p>
                <div className="mt-1"><Badge status={providerDetails.status} /></div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3">Coverage Areas</h3>
              <div className="flex flex-wrap gap-2">
                {providerDetails.regions_covered?.map((r, i) => (
                  <span key={i} className="bg-slate-100 text-slate-700 text-sm px-2.5 py-1 rounded-md border border-slate-200">{r}</span>
                ))}
                {!providerDetails.regions_covered?.length && <p className="text-sm text-slate-500">No regions assigned.</p>}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3">Schedule Shifts</h3>
              <div className="grid grid-cols-2 gap-2">
                {providerDetails.shifts?.map((s, i) => (
                  <div key={i} className="text-sm bg-white border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                    <span className="font-medium text-slate-700">{s.day}</span>
                    <span className="text-slate-500">{s.start} - {s.end}</span>
                  </div>
                ))}
                {!providerDetails.shifts?.length && <p className="text-sm text-slate-500">No active shifts scheduled.</p>}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3">Verification Documents</h3>
              <div className="space-y-3">
                {providerDetails.documents?.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                        <Badge status={doc.status} />
                      </div>
                    </div>
                    {doc.status !== 'Approved' && doc.status !== 'Rejected' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => docStatusMutation.mutate({ providerId: providerDetails.id, docId: doc.id, status: 'Approved' })}
                          className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium rounded transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => docStatusMutation.mutate({ providerId: providerDetails.id, docId: doc.id, status: 'Rejected' })}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {!providerDetails.documents?.length && <p className="text-sm text-slate-500">No documents uploaded.</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 animate-pulse">
            Loading provider profile...
          </div>
        )}
      </Modal>
    </div>
  );
}
