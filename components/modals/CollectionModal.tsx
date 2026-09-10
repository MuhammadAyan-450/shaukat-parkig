'use client';

import { useState } from 'react';
import { Payment, Rickshaw } from '@/lib/types';
import { unitLabelPlural } from '@/lib/utils';

export default function CollectionModal({
  payments,
  rickshaws,
  onClose,
  onUndo,
}: {
  payments: Payment[];
  rickshaws: Rickshaw[];
  onClose: () => void;
  onUndo: (payment: Payment) => void;
}) {
  const [search, setSearch] = useState('');

  function matchFor(rickshawId: string): Rickshaw | undefined {
    return rickshaws.find((r) => r.numberId === rickshawId);
  }
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const filtered = payments.filter(
    (p) => !search.trim() || p.rickshawId.toLowerCase().includes(search.trim().toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stepper-card list-card">
        <div className="stepper-title">Aaj Ka Collection</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#2e7d32', marginBottom: 12 }}>
          Rs {total}
        </div>
        <input
          type="text"
          className="modal-search"
          placeholder="Rickshaw number search karein..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ textAlign: 'left' }}>
          {sorted.length === 0 ? (
            <div className="list-empty">
              {search ? 'Koi payment nahi mili.' : 'Aaj tak koi payment nahi mili.'}
            </div>
          ) : (
            sorted.map((c) => {
              const r = matchFor(c.rickshawId);
              const unit = r ? unitLabelPlural(r.type) : 'din';
              return (
                <div className="collection-row" key={c.id}>
                  <div className="collection-num">{c.rickshawId}</div>
                  <div className="collection-stats">
                    <div className="collection-stat">
                      <span className="collection-stat-label">Paisa</span>
                      <span className="collection-stat-value paisa">Rs {c.amount}</span>
                    </div>
                    <div className="collection-stat">
                      <span className="collection-stat-label">Baqaya</span>
                      <span className="collection-stat-value baqaya">
                        {r ? r.absent : '—'} {unit}
                      </span>
                    </div>
                    <div className="collection-stat">
                      <span className="collection-stat-label">Kitne {unit} ka</span>
                      <span className="collection-stat-value">
                        {c.days} {unit}
                      </span>
                    </div>
                  </div>
                  <button
                    className="undo-btn"
                    onClick={() => {
                      const ok = confirm(
                        '"' + c.rickshawId + '" ki Rs ' + c.amount + ' (' + c.days + ' ' + unit + ') wali payment cancel karein?'
                      );
                      if (ok) onUndo(c);
                    }}
                  >
                    Undo
                  </button>
                </div>
              );
            })
          )}
        </div>
        <button className="stepper-close" onClick={onClose} style={{ marginTop: 14 }}>
          Band Karein
        </button>
      </div>
    </div>
  );
}