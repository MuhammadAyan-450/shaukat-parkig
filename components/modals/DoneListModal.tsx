'use client';

import { useState } from 'react';
import { Rickshaw } from '@/lib/types';

export default function DoneListModal({
  rickshaws,
  onClose,
  onRestore,
}: {
  rickshaws: Rickshaw[];
  onClose: () => void;
  onRestore: (rickshaw: Rickshaw) => void;
}) {
  const [confirmTarget, setConfirmTarget] = useState<Rickshaw | null>(null);

  if (confirmTarget) {
    return (
      <div className="overlay show" onClick={(e) => e.target === e.currentTarget && setConfirmTarget(null)}>
        <div className="stepper-card">
          <div className="stepper-title">Wapas Lao?</div>
          <div className="stepper-id">{confirmTarget.numberId}</div>
          <div className="stepper-note" style={{ marginBottom: 18 }}>
            Kya isse wapas pending list mein le jayen?
          </div>
          <div className="confirm-row">
            <button className="btn-cancel" onClick={() => setConfirmTarget(null)}>
              Nahi
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                onRestore(confirmTarget);
                setConfirmTarget(null);
              }}
            >
              Haan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stepper-card list-card">
        <div className="stepper-title" style={{ marginBottom: 12 }}>
          Aaj Aa Chuke Hain
        </div>
        <div style={{ textAlign: 'left' }}>
          {rickshaws.length === 0 ? (
            <div className="list-empty">Abhi koi nahi aaya.</div>
          ) : (
            rickshaws.map((s) => (
              <div className="list-row" key={s.id}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{s.numberId}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: s.absent > 0 ? '#e0521f' : '#2e7d32',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.absent} din baqaya
                </span>
                <button className="restore-btn" onClick={() => setConfirmTarget(s)}>
                  Wapas Lao
                </button>
              </div>
            ))
          )}
        </div>
        <button className="stepper-close" onClick={onClose} style={{ marginTop: 14 }}>
          Band Karein
        </button>
      </div>
    </div>
  );
}
