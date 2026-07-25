import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useToast } from '../components/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

export default function Promotions() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  
  // Form State
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [maxUses, setMaxUses] = useState(100);
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState('active');

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: promos, isLoading } = useQuery({
    queryKey: ['promos'],
    queryFn: () => api.promos()
  });

  const openCreateModal = () => {
    setEditingPromo(null);
    setCode('');
    setDiscountPercent(10);
    setMaxUses(100);
    setExpiryDate('');
    setStatus('active');
    setModalOpen(true);
  };

  const openEditModal = (promo) => {
    setEditingPromo(promo);
    setCode(promo.code);
    setDiscountPercent(promo.discount_percent);
    setMaxUses(promo.max_uses);
    setExpiryDate(promo.expiry_date.split('T')[0]);
    setStatus(promo.status);
    setModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.createPromo(data),
    onSuccess: () => {
      addToast('Promo code created successfully');
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      setModalOpen(false);
    },
    onError: (err) => addToast(err.message || 'Failed to create promo', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updatePromo(id, data),
    onSuccess: () => {
      addToast('Promo code updated');
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      setModalOpen(false);
    },
    onError: (err) => addToast(err.message || 'Failed to update promo', 'error')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPromo) {
      updateMutation.mutate({ 
        id: editingPromo.id, 
        data: { status, max_uses: Number(maxUses), expiry_date: new Date(expiryDate).toISOString() } 
      });
    } else {
      createMutation.mutate({ 
        code: code.toUpperCase(), 
        discount_percent: Number(discountPercent), 
        max_uses: Number(maxUses), 
        expiry_date: new Date(expiryDate).toISOString(), 
        status 
      });
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promotions</h1>
          <p className="text-slate-500 mt-1">Manage marketing promo codes and discounts.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create Promo
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Discount</th>
                <th className="px-6 py-4 font-semibold">Usage</th>
                <th className="px-6 py-4 font-semibold">Expiry Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">Loading promos...</td></tr>
              ) : promos?.length > 0 ? (
                promos.map(promo => {
                  const isExpired = new Date(promo.expiry_date) < new Date();
                  return (
                  <tr key={promo.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200 tracking-wider">
                        {promo.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-teal-600">{promo.discount_percent}% OFF</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.min(100, (promo.uses / promo.max_uses) * 100)}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-500">{promo.uses} / {promo.max_uses}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={isExpired ? 'text-rose-500' : 'text-slate-700'}>
                        {new Date(promo.expiry_date).toLocaleDateString()}
                      </span>
                      {isExpired && <span className="ml-2 text-[10px] uppercase font-bold text-rose-500 bg-rose-50 px-1 py-0.5 rounded">Expired</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={promo.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openEditModal(promo)}
                        className="text-slate-400 hover:text-teal-600 font-medium transition-colors p-1"
                      >
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    </td>
                  </tr>
                )})
              ) : (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No promo codes defined.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        title={editingPromo ? 'Edit Promo Code' : 'Create Promo Code'} 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Promo Code</label>
            <input 
              type="text" 
              required
              disabled={!!editingPromo}
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 uppercase font-mono disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="e.g. SUMMER20"
            />
            {!!editingPromo && <p className="text-xs text-slate-400 mt-1">Code and discount percentage cannot be changed after creation.</p>}
          </div>

          {!editingPromo && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Discount Percentage (%)</label>
              <input 
                type="number" 
                required min="1" max="100"
                value={discountPercent}
                onChange={e => setDiscountPercent(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Uses</label>
              <input 
                type="number" 
                required min="1"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
              <input 
                type="date" 
                required
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select 
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Promo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
