'use client';

import { useState } from 'react';
import { Rickshaw } from '@/lib/types';
import { defaultRateFor, naturalCompare } from '@/lib/utils';
import StaffRow from './StaffRow';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function BikeScreen({
  bikes,
  onClose,
  onAdd,
  onReport,
  onOpenStepper,
  onAaya,
  onDelete,
  onEdit,
  onHistory,
  onPaid,
}: {
  bikes: Rickshaw[];
  onClose: () => void;
  onAdd: (numberId: string, label: string, rate: number) => void;
  onReport: () => void;
  onOpenStepper: (r: Rickshaw) => void;
  onAaya: (r: Rickshaw) => void;
  onDelete: (r: Rickshaw) => void;
  onEdit: (r: Rickshaw) => void;
  onHistory: (r: Rickshaw) => void;
  onPaid: (r: Rickshaw) => void;
}) {
  const [numberId, setNumberId] = useState('');
  const [label, setLabel] = useState('');
  const [rate, setRate] = useState(String(defaultRateFor('bike')));
  const [error, setError] = useState('');

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const sorted = [...bikes].sort((a, b) => naturalCompare(a.numberId, b.numberId));

  function handleAdd() {
    const trimmed = numberId.trim();
    if (!trimmed) {
      setError('Bike number dalein.');
      return;
    }
    const exists = bikes.some((b) => b.numberId.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError('Yeh bike pehle se list mein hai.');
      return;
    }
    const rateNum = parseInt(rate, 10) || defaultRateFor('bike');
    onAdd(trimmed, label.trim(), rateNum);
    setNumberId('');
    setLabel('');
    setRate(String(defaultRateFor('bike')));
    setError('');
  }

  return (
    <div className="bike-screen">
      <div className="bike-header">
        <div>
          <div className="bike-header-title">🏍️ Bikes (Mahana)</div>
          <div className="bike-header-sub">{monthLabel}</div>
        </div>
        <button className="bike-close-x" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="bike-body">
        <button className="bike-report-btn" onClick={onReport}>
          📅 Mahana Report Dekhein
        </button>

        <div className="bike-add-card">
          <div className="bike-add-title">Naya Bike Add Karein</div>
          <div className="bike-add-grid">
            <input
              type="text"
              className="bike-input"
              placeholder="Bike Number"
              value={numberId}
              onChange={(e) => setNumberId(e.target.value)}
            />
            <input
              type="text"
              className="bike-input"
              placeholder="Naam ya Mol"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <input
              type="number"
              className="bike-input"
              placeholder="Rs / Mahina"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          {error && <div className="bike-error">{error}</div>}
          <button className="bike-add-btn" onClick={handleAdd}>
            + Bike Add Karein
          </button>
        </div>

        <div className="list">
          {sorted.length === 0 ? (
            <div className="empty">Abhi koi bike nahi hai. Upar se add karein.</div>
          ) : (
            sorted.map((r) => (
              <StaffRow
                key={r.id}
                rickshaw={r}
                onOpenStepper={() => onOpenStepper(r)}
                onAaya={() => onAaya(r)}
                onDelete={() => onDelete(r)}
                onEdit={() => onEdit(r)}
                onHistory={() => onHistory(r)}
                onPaid={() => onPaid(r)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
