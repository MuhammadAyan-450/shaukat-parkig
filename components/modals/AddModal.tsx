'use client';

import { useEffect, useState } from 'react';
import { RickshawType } from '@/lib/types';
import { defaultRateFor, unitLabel, RATE_STEP } from '@/lib/utils';

const TYPE_OPTIONS: { value: RickshawType; label: string }[] = [
  { value: 'rickshaw', label: '🛺 Rickshaw' },
  { value: 'redi', label: '🛒 Redi' },
  { value: 'chinchi', label: '🍡 Chinchi' },
];

export default function AddModal({
  existingIds,
  onClose,
  onAdd,
}: {
  existingIds: string[];
  onClose: () => void;
  onAdd: (numberId: string, type: RickshawType, rate: number) => void;
}) {
  const [val, setVal] = useState('');
  const [type, setType] = useState<RickshawType>('rickshaw');
  const [rate, setRateVal] = useState(defaultRateFor('rickshaw'));
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);

  // Type badalne par rate us type ke default par reset ho jata hai
  // (har kisi ka rate alag ho sakta hai, isliye +/- se yahin adjust kar lein).
  useEffect(() => {
    setRateVal(defaultRateFor(type));
  }, [type]);

  const step = RATE_STEP[type];

  function handleConfirm() {
    const trimmed = val.trim();
    if (!trimmed) return;
    const exists = existingIds.some((id) => id.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setDuplicateOf(trimmed);
      return;
    }
    onAdd(trimmed, type, rate);
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 14,
          }}
        >
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={'type-tab' + (type === t.value ? ' active' : '')}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="rate-row" style={{ justifyContent: 'center', marginBottom: 14 }}>
          <button
            type="button"
            className="rate-step"
            onClick={() => setRateVal((v) => Math.max(step, v - step))}
          >
            −
          </button>
          <span className="rate-value" style={{ fontSize: 15 }}>
            Rate: Rs {rate}/{unitLabel(type)}
          </span>
          <button type="button" className="rate-step" onClick={() => setRateVal((v) => v + step)}>
            +
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