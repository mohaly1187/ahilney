import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useToast } from '../components/ToastContext';
import Badge from '../components/Badge';

const STATUSES = ['Pending RS Acceptance', 'Confirmed', 'Finished', 'Rejected', 'Need Summary'];
const TYPES = ['Home Visit', 'Online Consultation'];

export default function Appointments() {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', filterStatus, filterType, debouncedSearch],
    queryFn: () => api.appointments({ 
      status: filterStatus || undefined, 
      type: filterType || undefined, 
      search: debouncedSearch || undefined 
    }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.setAppointmentStatus(id, status),
    onSuccess: () => {
      addToast('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err) => addToast(err.message || 'Failed to update status', 'error')
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
        <p className="text-slate-500 mt-1">Manage all system appointments and override statuses.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <input 
            type="text" 
            placeholder="Search by patient or provider..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white"
        >
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">ID / Date</th>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Provider</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Service / Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">Loading appointments...</td>
                </tr>
              ) : appointments?.length > 0 ? (
                appointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 group">
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-400 mb-1">#{apt.id}</div>
                      <div className="font-medium text-slate-700 whitespace-nowrap">
                        {new Date(apt.scheduled_time).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{apt.patient_name}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-medium">{apt.provider_name}</div>
                      <div className="text-xs text-slate-500">{apt.provider_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs text-slate-600">
                        {apt.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{apt.service_name || 'General Session'}</div>
                      <div className="text-xs font-semibold text-teal-600">{apt.total_charged} EGP</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={apt.status} />
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={apt.status}
                        onChange={(e) => statusMutation.mutate({ id: apt.id, status: e.target.value })}
                        disabled={statusMutation.isPending && statusMutation.variables?.id === apt.id}
                        className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white disabled:opacity-50"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">No appointments found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
