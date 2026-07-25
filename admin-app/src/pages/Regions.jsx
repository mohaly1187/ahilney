import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useToast } from '../components/ToastContext';

function RegionCard({ region }) {
  const [newSubName, setNewSubName] = useState('');
  const [newSubNameAr, setNewSubNameAr] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const addMutation = useMutation({
    mutationFn: () => api.addSubregion(region.id, newSubName, newSubNameAr),
    onSuccess: () => {
      addToast('Subregion added successfully');
      setNewSubName('');
      setNewSubNameAr('');
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ['regions'] });
    },
    onError: (err) => addToast(err.message || 'Failed to add subregion', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: (subId) => api.deleteSubregion(region.id, subId),
    onSuccess: () => {
      addToast('Subregion deleted');
      queryClient.invalidateQueries({ queryKey: ['regions'] });
    },
    onError: (err) => addToast(err.message || 'Failed to delete subregion', 'error')
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubNameAr.trim()) return;
    addMutation.mutate();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">{region.name}</h2>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{region.currency}</span>
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto max-h-[400px]">
        {region.subregions?.length > 0 ? (
          <ul className="space-y-2">
            {region.subregions.map(sub => (
              <li key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group">
                <div>
                  <span className="font-medium text-slate-700 text-sm">{sub.name}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-slate-500 text-sm" dir="rtl">{sub.name_ar}</span>
                </div>
                <button 
                  onClick={() => deleteMutation.mutate(sub.id)}
                  disabled={deleteMutation.isPending && deleteMutation.variables === sub.id}
                  className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Delete subregion"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">No subregions defined.</p>
        )}
      </div>

      <div className="p-5 border-t border-slate-100 bg-slate-50/50">
        {isAdding ? (
          <form onSubmit={handleAddSubmit} className="space-y-3">
            <input 
              type="text" 
              required placeholder="Name (EN)" 
              value={newSubName} onChange={e => setNewSubName(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
            <input 
              type="text" 
              required placeholder="Name (AR)" dir="rtl"
              value={newSubNameAr} onChange={e => setNewSubNameAr(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-right"
            />
            <div className="flex gap-2 pt-1">
              <button 
                type="submit" 
                disabled={addMutation.isPending}
                className="flex-1 bg-teal-600 text-white text-xs font-medium py-2 rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                Save
              </button>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium py-2 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-sm font-medium hover:border-teal-400 hover:text-teal-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Subregion
          </button>
        )}
      </div>
    </div>
  );
}

export default function Regions() {
  const { data: regions, isLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: () => api.regions()
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Coverage Regions</h1>
        <p className="text-slate-500 mt-1">Manage operational governorates and subregions for provider assignments.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-[400px] bg-slate-200 rounded-xl"></div>)}
        </div>
      ) : regions?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {regions.map(region => (
            <RegionCard key={region.id} region={region} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
          No regions found in the system.
        </div>
      )}
    </div>
  );
}
