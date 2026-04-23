import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export const Card = ({ children, className = '', variant = 'default' }) => {
  const baseStyle = "rounded-[var(--radius-card)] p-[var(--space-sm)]";
  let variantStyle = "";
  
  if (variant === 'elevated') {
    variantStyle = "bg-[var(--bg-card)] shadow-[var(--shadow-elevated)]";
  } else if (variant === 'hero') {
    variantStyle = "hero-gradient text-white shadow-[var(--shadow-elevated)]";
  } else {
    variantStyle = "bg-[var(--bg-card)] border border-[var(--border-subtle)]";
  }

  return (
    <div className={`${baseStyle} ${variantStyle} ${className}`}>
      {children}
    </div>
  );
};

export const Badge = ({ status, className = '' }) => {
  const st = status?.toLowerCase() || '';
  let styleClass = "bg-[var(--badge-inactive-bg)] text-[var(--badge-inactive-txt)]"; // inactive/default

  if (st === 'active') {
    styleClass = "bg-[var(--badge-active-bg)] text-[var(--badge-active-txt)]";
  } else if (st === 'warning' || st === 'upcoming') {
    styleClass = "bg-[var(--badge-warn-bg)] text-[var(--badge-warn-txt)]";
  } else if (st === 'urgent' || st === 'overdue') {
    styleClass = "bg-[var(--badge-urgent-bg)] text-[var(--badge-urgent-txt)]";
  } else if (st === 'monthly' || st === 'yearly' || st === 'quarterly') {
    styleClass = "bg-[var(--badge-freq-bg)] text-[var(--badge-freq-txt)]";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap capitalize ${styleClass} ${className}`}>
      {status}
    </span>
  );
};

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[12px] font-semibold text-[14px] transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  let variantClass = "";

  if (variant === 'primary') {
    variantClass = "bg-[var(--purple-primary)] text-white hover:bg-[#5A3EE0] shadow-[0_2px_8px_rgba(107,78,255,0.3)] hover:shadow-[0_4px_16px_rgba(107,78,255,0.4)] hover:-translate-y-px";
  } else if (variant === 'secondary') {
    variantClass = "border border-gray-200 text-[var(--text-secondary)] hover:bg-gray-50";
  } else if (variant === 'subtle') {
    variantClass = "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-50";
  }

  return (
    <button className={`${base} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const DataTable = ({ columns, data }) => (
  <div className="w-full">
    {/* Header */}
    <div className="grid pb-4 border-b border-[var(--border-subtle)] px-2" style={{ gridTemplateColumns: columns.map(c => c.gridTemplate).join(' ') }}>
      {columns.map((col, i) => (
        <div key={i} className="text-[12px] font-medium text-[var(--text-mute)] flex items-center gap-1" style={col.sortable ? { cursor: 'pointer' } : {}} onClick={col.onSort}>
          {col.title}
          {col.sortable && <ArrowUpDown size={12} className="text-[var(--purple-primary)] opacity-70" />}
        </div>
      ))}
    </div>
    
    {/* Body */}
    <div className="flex flex-col">
      {data.map((row, i) => (
        <div key={i} className="grid items-center py-[16px] border-b border-[var(--border-subtle)] last:border-0 hover:bg-[#F9FAFB] transition-colors px-2 -mx-2 rounded-lg" style={{ gridTemplateColumns: columns.map(c => c.gridTemplate).join(' ') }}>
          {columns.map((col, j) => (
            <div key={j}>
              {col.render(row)}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const BrandIcon = ({ name, color, size = 24, className = '' }) => (
  <div
    className={`flex-shrink-0 flex items-center justify-center text-white font-bold rounded-[10px] ${className}`}
    style={{
      width: size,
      height: size,
      minWidth: size,
      backgroundColor: color || '#6B4EFF',
      fontSize: size * 0.5,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}
  >
    {name?.charAt(0).toUpperCase() || '?'}
  </div>
);
