'use client';

import { useState } from 'react';
import { Rickshaw } from '@/lib/types';

export default function EditModal({
  rickshaw,
  onClose,
  onSave,
}: {
  rickshaw: Rickshaw;
  onClose: () => void;
  onSave: (newId: string) => void;
}) {
  const [val, setVal] = useState(rickshaw.numberId);

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
