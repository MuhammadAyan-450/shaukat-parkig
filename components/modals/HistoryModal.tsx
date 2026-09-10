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
  const credit = rickshaw.credit || 0;
  // Manual (stepper se ki gayi) correction entries history mein nahi dikhate —
  // sirf "Paid" (kitna diya) ya "Nahi Diya" dikhta hai, saaf aur seedha.
  const hist = [...rickshaw.history]
    .filter((h) => h.paidOff || !h.manual)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stepper-card list-card">
        <div className="stepper-title">Payment History</div>
        <div className="stepper-id">{rickshaw.numberId}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e0521f', marginBottom: 4 }}>
          Total Baqaya: Rs {rickshaw.absent * rate}
        </div>
        {credit !== 0 && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: credit > 0 ? '#1d5fd6' : '#c0392b',
              marginBottom: 12,
            }}
          >
            {credit > 0 ? '🔵 Advance (Jama)' : '🔴 Udhaar'}: {credit > 0 ? '+' : '-'}Rs {Math.abs(credit)}
          </div>
        )}
        <div style={{ textAlign: 'left', marginTop: credit !== 0 ? 0 : 8 }}>
          {hist.length === 0 ? (
            <div className="list-empty">Abhi koi history nahi hai.</div>
          ) : (
            hist.map((h, i) => {
              const dateLabel = formatHistoryDate(h.date);
              if (h.paidOff) {
                // Naya amount field agar mojood hai to wahi dikhayen (asal
                // mein diya gaya Rs — rate baad mein badle to bhi sahi
                // rahega). Purani entries (jinme amount save nahi tha) ke
                // liye current rate se andaza laga lete hain.
                const rsShown = typeof h.amount === 'number' ? h.amount : (-(h.delta || 0)) * rate;
                return (
                  <div className="list-row" key={i}>
                    <span style={{ fontSize: 14, color: '#777' }}>{dateLabel}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32', textAlign: 'right' }}>
                      ✅ Paid — Rs {rsShown}
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
                    {h.paid ? '✅ Paid' : '❌ Nahi Diya'}
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