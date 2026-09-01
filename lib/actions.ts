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
import { cycleDateStr, rateFor } from './utils';

export async function addRickshaw(numberId: string, type: RickshawType) {
  await addDoc(collection(db, 'rickshaws'), {
    numberId,
    type,
    absent: 0,
    status: 'A',
    history: [] as HistoryEntry[],
  });
}

export async function deleteRickshaw(id: string) {
  await deleteDoc(doc(db, 'rickshaws', id));
}

export async function renameRickshaw(id: string, newNumberId: string) {
  await updateDoc(doc(db, 'rickshaws', id), { numberId: newNumberId });
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
 * Rs amount le kar poore din (Rs 70/60 ke multiples) mein convert karta hai.
 * Sirf poore din hi kam hote hain — jitna Rs bacha wo agli baar count hoga.
 */
export async function markPaid(
  rickshaw: Rickshaw,
  rsAmount: number
): Promise<{ ok: boolean; message?: string }> {
  const rate = rateFor(rickshaw);
  const maxRs = rickshaw.absent * rate;
  const clamped = Math.min(Math.max(rsAmount, 0), maxRs);
  const days = Math.floor(clamped / rate);

  if (days < 1) {
    return { ok: false, message: `Kam se kam Rs ${rate} dalen (1 din ke barabar).` };
  }

  const amount = days * rate;
  const cid = 'c' + Date.now() + Math.random().toString(36).slice(2, 8);

  await runTransaction(db, async (tx) => {
    const rRef = doc(db, 'rickshaws', rickshaw.id);
    const rSnap = await tx.get(rRef);
    if (!rSnap.exists()) throw new Error('Rickshaw not found');
    const s = rSnap.data() as any;
    const currentAbsent: number = s.absent || 0;
    const history: HistoryEntry[] = s.history || [];
    const finalDays = Math.min(days, currentAbsent);
    if (finalDays < 1) return;

    const newHistory = [
      ...history,
      { date: cycleDateStr(new Date()), manual: true, delta: -finalDays, paidOff: true } as HistoryEntry,
    ];
    tx.update(rRef, { absent: currentAbsent - finalDays, history: newHistory });

    const pRef = doc(collection(db, 'payments'), cid);
    tx.set(pRef, {
      rickshawId: rickshaw.numberId,
      days: finalDays,
      amount: finalDays * rate,
      date: cycleDateStr(new Date()),
      time: new Date().toISOString(),
    });
  });

  return { ok: true };
}

/** Galti se hui payment cancel karta hai — baqaya din wapas add ho jate hain. */
export async function undoPayment(payment: Payment, rickshaws: Rickshaw[]) {
  const match = rickshaws.find((r) => r.numberId === payment.rickshawId);

  await runTransaction(db, async (tx) => {
    if (match) {
      const rRef = doc(db, 'rickshaws', match.id);
      const rSnap = await tx.get(rRef);
      if (rSnap.exists()) {
        const s = rSnap.data() as any;
        const currentAbsent: number = s.absent || 0;
        const history: HistoryEntry[] = s.history || [];
        const newHistory = [
          ...history,
          { date: cycleDateStr(new Date()), manual: true, delta: payment.days } as HistoryEntry,
        ];
        tx.update(rRef, { absent: currentAbsent + payment.days, history: newHistory });
      }
    }
    const pRef = doc(db, 'payments', payment.id);
    tx.delete(pRef);
  });

  return { restored: !!match };
}
