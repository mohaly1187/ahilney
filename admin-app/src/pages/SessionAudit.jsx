import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useToast } from '../components/ToastContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

function SummaryCard({ summary, onApprove, onReject, isApproving }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Session w/ {summary.patient_name}</h3>
          <p className="text-sm text-slate-500 mt-1">Provider: <span className="font-medium text-slate-700">{summary.provider_name}</span> ({summary.provider_type})</p>
        </div>
        <div className="text-right">
          <Badge status={summary.status} />
          <p className="text-xs text-slate-400 mt-2">{new Date(summary.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 bg-slate-50 rounded-lg p-4 border border-slate-100">
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase mb-1">Chief Complaint</span>
          <p className="text-sm text-slate-800">{summary.chief_complaint || '—'}</p>
        </div>
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase mb-1">Diagnosis</span>
          <p className="text-sm text-slate-800">{summary.diagnosis || '—'}</p>
        </div>
        <div className="col-span-2">
          <span className="block text-xs font-semibold text-slate-400 uppercase mb-1">Treatment Plan</span>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{summary.treatment_plan || '—'}</p>
        </div>
        {summary.prescription_given && (
          <div className="col-span-2 mt-2 pt-2 border-t border-slate-200">
            <span className="block text-xs font-semibold text-slate-400 uppercase mb-1">Prescription</span>
            <p className="text-sm text-slate-800">{summary.medications || 'Prescribed'}</p>
          </div>
        )}
      </div>

      {summary.status === 'Pending' && (
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
          <button 
            onClick={() => onApprove(summary.id)}
            disabled={isApproving}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isApproving ? 'Approving...' : 'Approve & Issue Payout'}
          </button>
          <button 
            onClick={() => onReject(summary.id)}
            disabled={isApproving}
            className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-medium transition-colors"
          >
            Reject
          </button>
        </div>
      )}
      
      {summary.status === 'Rejected' && summary.rejection_reason && (
        <div className="mt-4 p-3 bg-rose-50 text-rose-800 text-sm rounded-lg border border-rose-100">
          <span className="font-semibold">Rejection Reason:</span> {summary.rejection_reason}
        </div>
      )}
    </div>
  );
}

export default function SessionAudit() {
  const [tab, setTab] = useState('Pending');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: summaries, isLoading } = useQuery({
    queryKey: ['summaries', tab],
    queryFn: () => api.summaries(tab === 'Reviewed' ? undefined : 'Pending'),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.approveSummary(id),
    onSuccess: (data) => {
      addToast(`Summary approved! Payout: ${data.payout} EGP, Commission: ${data.commission} EGP`, 'success');
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (err) => addToast(err.message || 'Failed to approve', 'error')
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.rejectSummary(id, reason),
    onSuccess: () => {
      addToast('Summary rejected', 'success');
      setRejectModalOpen(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (err) => addToast(err.message || 'Failed to reject', 'error')
  });

  const handleRejectClick = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) return addToast('Reason is required', 'error');
    rejectMutation.mutate({ id: rejectingId, reason: rejectReason });
  };

  const filteredSummaries = tab === 'Reviewed' 
    ? summaries?.filter(s => s.status !== 'Pending') 
    : summaries;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Session Audit</h1>
          <p className="text-slate-500 mt-1">Review clinical summaries and trigger provider payouts.</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'Pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setTab('Pending')}
          >
            Pending Review
          </button>
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'Reviewed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setTab('Reviewed')}
          >
            Reviewed History
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-200 rounded-xl"></div>)}
        </div>
      ) : filteredSummaries?.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredSummaries.map(summary => (
            <SummaryCard 
              key={summary.id} 
              summary={summary}
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={handleRejectClick}
              isApproving={approveMutation.isPending && approveMutation.variables === summary.id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto mb-4 text-slate-300">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No {tab.toLowerCase()} summaries found.
        </div>
      )}

      <Modal title="Reject Summary" isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Provide a reason for rejecting this summary. The provider will see this reason and will need to submit a new summary to receive their payout.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Missing detailed treatment plan steps..."
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[100px]"
          />
          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmReject}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              className="px-4 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
