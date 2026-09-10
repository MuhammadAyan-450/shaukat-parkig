'use client';

import { useMemo, useState } from 'react';
import { Payment, Rickshaw, RickshawType } from '@/lib/types';
import { MONTH_NAMES_FULL, MONTH_NAMES_SHORT, formatHistoryDate } from '@/lib/utils';

export default function MonthlyReportModal({
  payments,
  rickshaws,
  filterType,
  onClose,
}: {
  payments: Payment[];
  rickshaws: Rickshaw[];
  filterType?: RickshawType;
  onClose: () => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11

  // Agar filterType diya hai (jaise Bike screen se) to sirf usi type ki
  // payments ginte hain — numberId se current rickshaw dhoond kar type check.
  const relevant = useMemo(() => {
    if (!filterType) return payments;
    const typeByNumber = new Map(rickshaws.map((r) => [r.numberId, r.type]));
    return payments.filter((p) => typeByNumber.get(p.rickshawId) === filterType);
  }, [payments, rickshaws, filterType]);

  // Saal ke sab 12 mahino ka total, month-grid mein chhota preview dikhane ke liye.
  const monthTotals = useMemo(() => {
    const totals = new Array(12).fill(0);
    for (const p of relevant) {
      const [y, m] = p.date.split('-').map(Number);
      if (y === year) totals[m - 1] += p.amount;
    }
    return totals;
  }, [relevant, year]);

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  // Har rickshaw alag nahi, balke DIN ke hisab se total — jaise "10 Sep: Rs 700".
  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of relevant) {
      if (!p.date.startsWith(monthKey)) continue;
      map.set(p.date, (map.get(p.date) || 0) + p.amount);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])); // naya date pehle
  }, [relevant, monthKey]);
  const monthTotal = monthTotals[month];
  const yearTotal = monthTotals.reduce((s, v) => s + v, 0);

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stepper-card list-card report-card">
        <div className="stepper-title">
          Mahana Report{filterType ? ` — ${filterType === 'bike' ? 'Bikes' : filterType}` : ''}
        </div>

        <div className="report-year-row">
          <button className="report-year-btn" onClick={() => setYear((y) => y - 1)}>
            ◀
          </button>
          <span className="report-year-label">{year}</span>
          <button className="report-year-btn" onClick={() => setYear((y) => y + 1)}>
            ▶
          </button>
        </div>
        <div className="report-year-total">Poore Saal Ka Total: Rs {yearTotal}</div>

        <div className="report-month-grid">
          {MONTH_NAMES_SHORT.map((name, i) => (
            <button
              key={name}
              className={'report-month-btn' + (i === month ? ' active' : '')}
              onClick={() => setMonth(i)}
            >
              <span className="report-month-name">{name}</span>
              <span className="report-month-amt">{monthTotals[i] > 0 ? `Rs ${monthTotals[i]}` : '—'}</span>
            </button>
          ))}
        </div>

        <div className="report-selected-title">{MONTH_NAMES_FULL[month]} {year}</div>
        <div className="report-selected-total">Rs {monthTotal}</div>

        <div style={{ textAlign: 'left' }}>
          {dailyTotals.length === 0 ? (
            <div className="list-empty">Is mahine koi payment nahi mili.</div>
          ) : (
            dailyTotals.map(([date, total]) => (
              <div className="list-row" key={date}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{formatHistoryDate(date)}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#2e7d32' }}>Rs {total}</span>
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
