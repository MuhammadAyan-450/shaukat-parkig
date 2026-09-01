'use client';

import { useState } from 'react';
import { RickshawType } from '@/lib/types';

export default function AddModal({
  existingIds,
  onClose,
  onAdd,
}: {
  existingIds: string[];
  onClose: () => void;
  onAdd: (numberId: string, type: RickshawType) => void;
}) {
  const [val, setVal] = useState('');
  const [type, setType] = useState<RickshawType>('rickshaw');
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);

  function handleConfirm() {
    const trimmed = val.trim();
    if (!trimmed) return;
    const exists = existingIds.some((id) => id.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setDuplicateOf(trimmed);
      return;
    }
    onAdd(trimmed, type);
    onClose();
  }

  if (duplicateOf !== null) {
    return (
      <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="stepper-card">
          <div className="stepper-title">Pehle Se Maujood</div>
          <div className="stepper-id">{duplicateOf}</div>
          <div className="stepper-note" style={{ marginBottom: 18 }}>
            Yeh number ya naam pehle se list mein hai.
          </div>
          <button className="btn-primary" onClick={onClose}>
            Theek Hai
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stepper-card">
        <div className="stepper-title">Add Karein</div>
        <div className="confirm-row" style={{ marginBottom: 14 }}>
          <button
            type="button"
            className={'type-tab' + (type === 'rickshaw' ? ' active' : '')}
            onClick={() => setType('rickshaw')}
          >
            🛺 Rickshaw
          </button>
          <button
            type="button"
            className={'type-tab' + (type === 'redi' ? ' active' : '')}
            onClick={() => setType('redi')}
          >
            🛒 Redi
          </button>
        </div>
        <div style={{ margin: '10px 0 18px' }}>
          <input
            type="text"
            className="add-text-input"
            placeholder="Number ya Naam"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            autoFocus
          />
        </div>
        <div className="confirm-row">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleConfirm}>
            Add Karein
          </button>
        </div>
      </div>
    </div>
  );
}
