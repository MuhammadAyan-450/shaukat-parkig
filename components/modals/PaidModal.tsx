'use client';

import { useEffect, useState } from 'react';
import { Rickshaw } from '@/lib/types';
import { rateFor, unitLabelPlural } from '@/lib/utils';

export default function PaidModal({
  rickshaw,
  onClose,
  onConfirm,
}: {
  rickshaw: Rickshaw;
  onClose: () => void;
  onConfirm: (rsAmount: number) => Promise<{ ok: boolean; message?: string }>;
}) {
  const rate = rateFor(rickshaw);
  const owedRs = rickshaw.absent * rate;
  const [val, setVal] = useState(owedRs || rate);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVal(owedRs || rate);
  }, [rickshaw.id, owedRs, rate]);

  const safeVal = Math.max(val, 0);
  const daysRounded = Math.round(safeVal / rate);
  const daysApplied = Math.min(daysRounded, rickshaw.absent);
  const extraDays = daysRounded - daysApplied;
  const diff = safeVal - daysRounded * rate; // +/- farq
  const creditDelta = extraDays * rate + diff;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let n = parseInt(e.target.value, 10);
    if (isNaN(n) || n < 0) n = 0;
    setVal(n);
  }

  async function handleConfirm() {
    setBusy(true);
    const res = await onConfirm(val);
    setBusy(false);
    if (!res.ok && res.message) {
      alert(res.message);
      return;
    }
    onClose();
  }

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stepper-card">
        <div className="stepper-title">Kitna Paisa Mila? (Rs)</div>
        <div className="stepper-id">{rickshaw.numberId}</div>
        <div className="stepper-note">
          Kul Baqaya: {rickshaw.absent} {unitLabelPlural(rickshaw.type)} (Rs {owedRs})
          {(rickshaw.credit || 0) !== 0 && (
            <>
              <br />
              <span style={{ color: rickshaw.credit > 0 ? '#1d5fd6' : '#c0392b', fontWeight: 700 }}>
                Pehle Se {rickshaw.credit > 0 ? 'Advance' : 'Udhaar'}: {rickshaw.credit > 0 ? '+' : '-'}Rs{' '}
                {Math.abs(rickshaw.credit)}
              </span>
            </>
          )}
        </div>
        <div className="stepper-controls">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={1}
            className="stepper-input green"
            value={val}
            onFocus={(e) => e.target.select()}
            onChange={handleChange}
            autoFocus
          />
        </div>
        <div className="stepper-sub" style={{ marginBottom: 18 }}>
          {daysApplied} {unitLabelPlural(rickshaw.type)} kam honge (Rs {daysApplied * rate})
          {creditDelta !== 0 && (
            <>
              <br />
              <span style={{ color: creditDelta > 0 ? '#1d5fd6' : '#c0392b' }}>
                {creditDelta > 0 ? '+' : '-'}Rs {Math.abs(creditDelta)} {creditDelta > 0 ? 'Advance' : 'Udhaar'}
              </span>
            </>
          )}
        </div>
        <div className="confirm-row">
          <button className="btn-cancel" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-confirm" onClick={handleConfirm} disabled={busy}>
            Paisa Mil Gaya
          </button>
        </div>
      </div>
    </div>
  );
}