import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useToast } from '../components/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

export default function Patients() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', debouncedSearch],
    queryFn: () => api.patients({ search: debouncedSearch || undefined }),
  });

  const { data: patientDetails } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: () => api.patient(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, amount, reason }) => api.refundPatient(id, amount, reason),
    onSuccess: (data) => {
      addToast(`Refund successful. New balance: ${data.new_balance} EGP`);
      queryClient.invalidateQueries({ queryKey: ['patient', selectedPatientId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setRefundAmount('');
      setRefundReason('');
    },
    onError: (err) => addToast(err.message || 'Refund failed', 'error')
  });

  const handleRefund = (e) => {
    e.preventDefault();
    if (!refundAmount || !refundReason) return;
    refundMutation.mutate({ id: selectedPatientId, amount: Number(refundAmount), reason: refundReason });
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
        <p className="text-slate-500 mt-1">Directory of all patients, medical history, and wallet management.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <input 
          type="text" 
          placeholder="Search patients by name, phone, email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Address</th>
                <th className="px-6 py-4 font-semibold text-center">Sessions</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">Loading patients...</td>
                </tr>
              ) : patients?.length > 0 ? (
                patients.map(patient => (
                  <tr key={patient.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{patient.name}</div>
                      <div className="text-xs text-slate-500">Age: {patient.age}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{patient.phone}</div>
                      <div className="text-slate-500 text-xs">{patient.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]" title={patient.address}>
                      {patient.address}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">
                      {patient.total_appointments || patient.completed_sessions_count || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedPatientId(patient.id)}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium hover:underline"
                      >
                        View Record
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No patients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        title={patientDetails ? `Patient Record: ${patientDetails.name}` : 'Loading...'} 
        isOpen={!!selectedPatientId} 
        onClose={() => setSelectedPatientId(null)}
      >
        {patientDetails ? (
          <div className="space-y-8">
            <div className="flex justify-between items-start bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase">Contact & Profile</p>
                <p className="text-sm font-medium text-slate-900">{patientDetails.phone} • {patientDetails.email}</p>
                <p className="text-sm text-slate-600">{patientDetails.address}</p>
                <p className="text-sm text-slate-600">Age: {patientDetails.age} • Completed Sessions: {patientDetails.completed_sessions_count}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-400 uppercase">Wallet Balance</p>
                <p className="text-xl font-bold text-teal-600">{patientDetails.wallet_balance} EGP</p>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3">Medical History</h3>
              <p className="text-sm text-slate-700 bg-white border border-slate-100 p-4 rounded-lg whitespace-pre-wrap leading-relaxed shadow-sm">
                {patientDetails.medical_history || 'No medical history recorded.'}
              </p>
            </div>

            {/* Treatment Plans & Prescriptions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3">Active Treatment Plans</h3>
                <div className="space-y-3">
                  {patientDetails.treatment_plans?.length > 0 ? patientDetails.treatment_plans.map(tp => (
                    <div key={tp.id} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-slate-800 text-sm">{tp.diagnosis}</span>
                        <Badge status={tp.status} />
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{tp.text}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{new Date(tp.date).toLocaleDateString()}</span>
                    </div>
                  )) : <p className="text-sm text-slate-500">No active plans.</p>}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3">Recent Prescriptions</h3>
                <div className="space-y-3">
                  {patientDetails.prescriptions?.length > 0 ? patientDetails.prescriptions.map(pr => (
                    <div key={pr.id} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-slate-800 mb-2 whitespace-pre-wrap">{pr.text}</p>
                      <span className="text-xs text-slate-500">Prescribed by {pr.doctor}</span>
                    </div>
                  )) : <p className="text-sm text-slate-500">No prescriptions.</p>}
                </div>
              </div>
            </div>

            {/* Wallet Management / Refund */}
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-rose-900 mb-2">Issue Wallet Refund / Adjustment</h3>
              <p className="text-xs text-rose-700 mb-4">Refunds will be directly credited to the patient's wallet balance.</p>
              <form onSubmit={handleRefund} className="flex gap-3 items-start">
                <div className="w-32">
                  <input 
                    type="number" 
                    required min="1"
                    placeholder="Amount" 
                    value={refundAmount}
                    onChange={e => setRefundAmount(e.target.value)}
                    className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 bg-white"
                  />
                </div>
                <div className="flex-1">
                  <input 
                    type="text" 
                    required
                    placeholder="Reason for refund (e.g., No-show adjustment)" 
                    value={refundReason}
                    onChange={e => setRefundReason(e.target.value)}
                    className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 bg-white"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={refundMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {refundMutation.isPending ? 'Processing...' : 'Issue Refund'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 animate-pulse">
            Loading patient record...
          </div>
        )}
      </Modal>
    </div>
  );
}
