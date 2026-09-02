'use client';

import { Rickshaw } from '@/lib/types';
import { formatHistoryDate, rateFor } from '@/lib/utils';

export default function HistoryModal({
  rickshaw,
  onClose,
}: {
  rickshaw: Rickshaw;
  onClose: () => void;
}) {
  const rate = rateFor(rickshaw);
  const hasCredit = (rickshaw.credit || 0) > 0;
  const hist = [...rickshaw.history].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stepper-card list-card">
        <div className="stepper-title">Payment History</div>
        <div className="stepper-id">{rickshaw.numberId}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e0521f', marginBottom: 4 }}>
          Total Baqaya: Rs {rickshaw.absent * rate}
        </div>
        {hasCredit && (
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1d5fd6', marginBottom: 12 }}>
            🔵 Advance (Jama): Rs {rickshaw.credit}
          </div>
        )}
        <div style={{ textAlign: 'left', marginTop: hasCredit ? 0 : 8 }}>
          {hist.length === 0 ? (
            <div className="list-empty">Abhi koi history nahi hai.</div>
          ) : (
            hist.map((h, i) => {
              const dateLabel = formatHistoryDate(h.date);
              if (h.paidOff) {
                return (
                  <div className="list-row" key={i}>
                    <span style={{ fontSize: 14, color: '#777' }}>{dateLabel}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32', textAlign: 'right' }}>
                      💰 Paid Rs {(-(h.delta || 0)) * rate} ({-(h.delta || 0)} din)
                      {(h.creditAdded || 0) > 0 && (
                        <>
                          <br />
                          <span style={{ color: '#1d5fd6' }}>+Rs {h.creditAdded} Advance</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              }
              if (h.manual) {
                const sign = (h.delta || 0) > 0 ? '+' : '';
                return (
                  <div className="list-row" key={i}>
                    <span style={{ fontSize: 14, color: '#777' }}>{dateLabel}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#888', textAlign: 'right' }}>
                      🛠 Manual {sign}
                      {h.delta} din
                      {(h.creditUsed || 0) > 0 && (
                        <>
                          <br />
                          <span style={{ color: '#1d5fd6' }}>-Rs {h.creditUsed} Advance</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              }
              return (
                <div className="list-row" key={i}>
                  <span style={{ fontSize: 14, color: '#777' }}>{dateLabel}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: h.paid ? '#2e7d32' : '#e53935',
                    }}
                  >
                    {h.paid ? '✅ Diya' : '❌ Nahi Diya'}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <button className="stepper-close" onClick={onClose}>
          Band Karein
        </button>
      </div>
    </div>
  );
}