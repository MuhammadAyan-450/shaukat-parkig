'use client';

import { Rickshaw } from '@/lib/types';
import { rateFor } from '@/lib/utils';

export default function StaffRow({
  rickshaw,
  onOpenStepper,
  onAaya,
  onDelete,
  onEdit,
  onHistory,
  onPaid,
}: {
  rickshaw: Rickshaw;
  onOpenStepper: () => void;
  onAaya: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onHistory: () => void;
  onPaid: () => void;
}) {
  const rate = rateFor(rickshaw);

  return (
    <div className="staff-row">
      <div className="staff-left">
        <button className="absent-badge" onClick={onOpenStepper}>
          {rickshaw.absent}
        </button>
        <div>
          <div className="staff-id">
            <span style={{ cursor: 'pointer' }} onClick={onHistory}>
              {rickshaw.numberId}
            </span>
            <span style={{ fontSize: 12, color: '#bbb', cursor: 'pointer', padding: 4 }} onClick={onEdit}>
              ✎
            </span>
          </div>
          <div className="staff-hrs">
            {rickshaw.absent} din baqaya · Rs {rickshaw.absent * rate}{' '}
            <span style={{ color: '#bbb' }}>({rickshaw.type === 'redi' ? 'Redi' : 'Rickshaw'})</span>
          </div>
        </div>
      </div>
      <div className="staff-actions">
        <button className="paid-btn" onClick={onPaid} disabled={rickshaw.absent === 0}>
          💰 Paid
        </button>
        <button className="aaya-btn" onClick={onAaya}>
          Aa Gaya
        </button>
        <button className="menu-btn" onClick={onDelete} style={{ color: '#e53935', borderColor: '#e5a3a0' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
