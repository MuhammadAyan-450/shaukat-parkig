import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Rickshaw, RickshawType, HistoryEntry, Payment } from './types';
import { cycleDateStr, rateFor, defaultRateFor, isMonthly } from './utils';

export async function addRickshaw(numberId: string, type: RickshawType, rate?: number, label?: string) {
  const safeRate = rate && rate > 0 ? rate : defaultRateFor(type);
  await addDoc(collection(db, 'rickshaws'), {
    numberId,
    type,
    ...(label && label.trim() ? { label: label.trim() } : {}),
    absent: 0,
    credit: 0,
    status: 'A',
    history: [] as HistoryEntry[],
    rate: safeRate,
    ...(isMonthly(type) ? { cycleDay: 0 } : {}),
  });
}

/** Kisi gari ka rate badalta hai — daily walon ke liye +/-10, bike ke liye +/-100 wagera. */
export async function setRate(rickshaw: Rickshaw, newRate: number) {
  const safe = Math.max(1, Math.round(newRate));
  await updateDoc(doc(db, 'rickshaws', rickshaw.id), { rate: safe });
}

export async function deleteRickshaw(id: string) {
  await deleteDoc(doc(db, 'rickshaws', id));
}

export async function renameRickshaw(id: string, newNumberId: string) {
  await updateDoc(doc(db, 'rickshaws', id), { numberId: newNumberId });
}

export async function setLabel(id: string, label: string) {
  await updateDoc(doc(db, 'rickshaws', id), { label: label.trim() });
}

export async function markAaya(id: string) {
  await updateDoc(doc(db, 'rickshaws', id), { status: 'P' });
}

export async function restoreToPending(id: string) {
  await updateDoc(doc(db, 'rickshaws', id), { status: 'A' });
}

export async function setAbsentManual(rickshaw: Rickshaw, newVal: number) {
  const delta = newVal - rickshaw.absent;
  const history = delta !== 0
    ? [...rickshaw.history, { date: cycleDateStr(new Date()), manual: true, delta } as HistoryEntry]
    : rickshaw.history;
  await updateDoc(doc(db, 'rickshaws', rickshaw.id), { absent: newVal, history });
}

/**
 * Koi bhi Rs amount le sakta hai — poore din ke rate (Rs 70/60) ke qareeb
 * tareen (nearest) din ginta hai, aur farq +/- credit mein chala jata hai:
 *  - Rate se KAM diya (60 jab rate 70 hai)  → -10 (thoda udhaar reh gaya)
 *  - Rate se ZYADA diya (80 jab rate 70 hai) → +10 (itna advance jama)
 *  - Poore baqaya se zyada din ke paise diye  → extra din bhi advance ban jate hain
 * Misaal: 2 din (Rs140) baqaya, Rs210 diye → poora baqaya clear + 1 din (Rs70) advance.
 * Misaal: 7 din (Rs490) baqaya, Rs500 diye → poora baqaya clear + Rs10 jama.
 */
export async function markPaid(
  rickshaw: Rickshaw,
  rsAmount: number
): Promise<{ ok: boolean; message?: string }> {
  const rate = rateFor(rickshaw);
  const rs = Math.max(0, Math.round(rsAmount));

  if (rs < 1) {
    return { ok: false, message: 'Kam se kam Rs 1 dalen.' };
  }

  // Rate ke qareeb tareen (nearest) din ginte hain — 60 → 1 din (-10), 210 → 3 din (0)
  const daysRounded = Math.round(rs / rate);
  const diffFromRounded = rs - daysRounded * rate; // +/- farq

  const cid = 'c' + Date.now() + Math.random().toString(36).slice(2, 8);

  await runTransaction(db, async (tx) => {
    const rRef = doc(db, 'rickshaws', rickshaw.id);
    const rSnap = await tx.get(rRef);
    if (!rSnap.exists()) throw new Error('Rickshaw not found');
    const s = rSnap.data() as any;
    const currentAbsent: number = s.absent || 0;
    const currentCredit: number = s.credit || 0;
    const history: HistoryEntry[] = s.history || [];

    const daysApplied = Math.min(daysRounded, currentAbsent); // baqaya se ziyada din kam nahi honge
    const extraDays = daysRounded - daysApplied; // baqaya se zyada din ke paise = advance
    const creditDelta = extraDays * rate + diffFromRounded;

    const newAbsent = currentAbsent - daysApplied;
    const newCredit = currentCredit + creditDelta;

    const newHistory = [
      ...history,
      {
        date: cycleDateStr(new Date()),
        manual: true,
        delta: -daysApplied,
        paidOff: true,
        amount: rs, // asal mein diya gaya Rs — rate baad mein badle to bhi yeh fix rahega
        ...(creditDelta !== 0 ? { creditDelta } : {}),
      } as HistoryEntry,
    ];

    tx.update(rRef, { absent: newAbsent, credit: newCredit, history: newHistory });

    const pRef = doc(collection(db, 'payments'), cid);
    tx.set(pRef, {
      rickshawId: rickshaw.numberId,
      days: daysApplied,
      amount: rs,
      ...(creditDelta !== 0 ? { creditDelta } : {}),
      date: cycleDateStr(new Date()),
      time: new Date().toISOString(),
    });
  });

  return { ok: true };
}

/** Galti se hui payment cancel karta hai — baqaya din aur credit dono wapas ho jate hain. */
export async function undoPayment(payment: Payment, rickshaws: Rickshaw[]) {
  const match = rickshaws.find((r) => r.numberId === payment.rickshawId);

  await runTransaction(db, async (tx) => {
    if (match) {
      const rRef = doc(db, 'rickshaws', match.id);
      const rSnap = await tx.get(rRef);
      if (rSnap.exists()) {
        const s = rSnap.data() as any;
        const currentAbsent: number = s.absent || 0;
        const currentCredit: number = s.credit || 0;
        const history: HistoryEntry[] = s.history || [];
        const creditDelta = payment.creditDelta || 0;

        const newHistory = [
          ...history,
          {
            date: cycleDateStr(new Date()),
            manual: true,
            delta: payment.days,
            ...(creditDelta !== 0 ? { creditDelta: -creditDelta } : {}),
          } as HistoryEntry,
        ];

        tx.update(rRef, {
          absent: currentAbsent + payment.days,
          credit: currentCredit - creditDelta,
          history: newHistory,
        });
      }
    }
    const pRef = doc(db, 'payments', payment.id);
    tx.delete(pRef);
  });

  return { restored: !!match };
}