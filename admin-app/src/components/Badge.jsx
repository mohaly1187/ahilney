import React from 'react';

export default function Badge({ status, children }) {
  const text = children || status;
  let bg = 'bg-slate-100';
  let fg = 'text-slate-700';
  let border = 'border-slate-200';

  const s = String(status || '').toLowerCase();
  
  if (['approved', 'active', 'finished', 'confirmed', 'success'].includes(s)) {
    bg = 'bg-emerald-50'; 
    fg = 'text-emerald-700';
    border = 'border-emerald-200';
  } else if (['pending', 'pending rs acceptance', 'need summary', 'review', 'interview'].includes(s)) {
    bg = 'bg-amber-50'; 
    fg = 'text-amber-700';
    border = 'border-amber-200';
  } else if (['rejected', 'inactive', 'failed'].includes(s)) {
    bg = 'bg-rose-50'; 
    fg = 'text-rose-700';
    border = 'border-rose-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg} ${fg} ${border}`}>
      {text}
    </span>
  );
}
