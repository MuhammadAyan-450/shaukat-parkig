'use client';

import { useEffect, useState } from 'react';
import { Rickshaw } from '@/lib/types';
import { rateFor } from '@/lib/utils';

export default function StepperModal({
  rickshaw,
  onClose,
  onSave,
}: {
  rickshaw: Rickshaw;
  onClose: () => void;
  onSave: (newVal: number) => void;
}) {
  const [val, setVal] = useState(rickshaw.absent);

  useEffect(() => {
    setVal(rickshaw.absent);
  }, [rickshaw.id, rickshaw.absent]);

  const rate = rateFor(rickshaw);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let n = parseInt(e.target.value, 10);
    if (isNaN(n) || n < 0) n = 0;
    setVal(n);
    onSave(n);
  }

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stepper-card">
        <div className="stepper-title">Baqaya Din</div>
        <div className="stepper-id">{rickshaw.numberId}</div>
        <div className="stepper-controls">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            className="stepper-input"
            value={val}
            onFocus={(e) => e.target.select()}
            onChange={handleChange}
            autoFocus
          />
        </div>
        <div className="stepper-sub">Rs {val * rate}</div>
        <button className="stepper-close" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
