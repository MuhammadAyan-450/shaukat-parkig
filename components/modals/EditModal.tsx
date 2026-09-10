'use client';

import { useState } from 'react';
import { Rickshaw } from '@/lib/types';
import { rateFor, unitLabel, RATE_STEP } from '@/lib/utils';

export default function EditModal({
  rickshaw,
  onClose,
  onSave,
  onRateChange,
}: {
  rickshaw: Rickshaw;
  onClose: () => void;
  onSave: (newId: string) => void;
  onRateChange: (newRate: number) => void;
}) {
  const [val, setVal] = useState(rickshaw.numberId);
  const rate = rateFor(rickshaw);
  const step = RATE_STEP[rickshaw.type];

  function handleSave() {
    const trimmed = val.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  }

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stepper-card">
        <div className="stepper-title">Naam / Number Badlein</div>
        <div style={{ margin: '10px 0 18px' }}>
          <input
            type="text"
            className="add-text-input"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>
        <div className="stepper-title" style={{ marginBottom: 8 }}>Rate</div>
        <div className="rate-row" style={{ justifyContent: 'center', marginBottom: 18 }}>
          <button
            type="button"
            className="rate-step"
            onClick={() => onRateChange(Math.max(step, rate - step))}
          >
            −
          </button>
          <span className="rate-value" style={{ fontSize: 15 }}>
            Rs {rate}/{unitLabel(rickshaw.type)}
          </span>
          <button type="button" className="rate-step" onClick={() => onRateChange(rate + step)}>
            +
          </button>
        </div>
        <div className="confirm-row">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save Karein
          </button>
        </div>
      </div>
    </div>
  );
}
