'use client';

import { useEffect, useState } from 'react';
import { Rickshaw } from '@/lib/types';
import { rateFor } from '@/lib/utils';

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

  // Baqaya se zyada diya gaya hissa ab clamp nahi hota — woh advance (jama) ban jayega.
  const safeVal = Math.max(val, 0);
  const days = Math.min(rickshaw.absent, Math.floor(safeVal / rate));
  const extraRs = safeVal - owedRs > 0 ? safeVal - owedRs : 0;

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
          Kul Baqaya: {rickshaw.absent} din (Rs {owedRs})
          {(rickshaw.credit || 0) > 0 && (
            <>
              <br />
              <span style={{ color: '#1d5fd6', fontWeight: 700 }}>
                Pehle Se Advance: Rs {rickshaw.credit}
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
          {days} din kam honge (Rs {days * rate})
          {extraRs > 0 && (
            <>
              <br />
              <span style={{ color: '#1d5fd6' }}>+ Rs {extraRs} Advance Jama Hoga</span>
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