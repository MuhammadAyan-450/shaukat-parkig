'use client';

import { Payment } from '@/lib/types';

export default function CollectionModal({
  payments,
  onClose,
  onUndo,
}: {
  payments: Payment[];
  onClose: () => void;
  onUndo: (payment: Payment) => void;
}) {
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const sorted = [...payments].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stepper-card list-card">
        <div className="stepper-title">Aaj Ka Collection</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#2e7d32', marginBottom: 12 }}>
          Rs {total}
        </div>
        <div style={{ textAlign: 'left' }}>
          {sorted.length === 0 ? (
            <div className="list-empty">Aaj tak koi payment nahi mili.</div>
          ) : (
            sorted.map((c) => (
              <div className="list-row" key={c.id}>
                <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{c.rickshawId}</span>
                <span
                  style={{
                    fontSize: 13,
                    color: '#2e7d32',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Rs {c.amount} ({c.days} din)
                </span>
                <button
                  className="undo-btn"
                  onClick={() => {
                    const ok = confirm(
                      '"' + c.rickshawId + '" ki Rs ' + c.amount + ' (' + c.days + ' din) wali payment cancel karein?'
                    );
                    if (ok) onUndo(c);
                  }}
                >
                  Undo
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
