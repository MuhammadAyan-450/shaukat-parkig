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
    credit: 0,
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
 * Agar diya gaya paisa baqaya se ZYADA ho, to jitna zyada hai wo "credit"
 * (advance/jama) ban jata hai — agli baar automatically usi se din kam
 * honge (rollover mein). Misaal: 2 din (Rs140) baqaya, Rs210 diye → poora
 * baqaya clear + Rs70 (1 din) advance jama.
 */
export async function markPaid(
  rickshaw: Rickshaw,
  rsAmount: number
): Promise<{ ok: boolean; message?: string }> {
  const rate = rateFor(rickshaw);
  const rs = Math.max(0, Math.floor(rsAmount));

  if (rs < 1) {
    return { ok: false, message: 'Kam se kam Rs 1 dalen.' };
  }

  const owedRs = rickshaw.absent * rate;
  const daysAgainstOwed = Math.min(rickshaw.absent, Math.floor(rs / rate));
  const extraRs = rs - owedRs > 0 ? rs - owedRs : 0; // baqaya se zyada diya gaya hissa

  if (daysAgainstOwed < 1 && extraRs < 1) {
    return { ok: false, message: `Kam se kam Rs ${rate} dalen (1 din ke barabar).` };
  }

  const cid = 'c' + Date.now() + Math.random().toString(36).slice(2, 8);

  await runTransaction(db, async (tx) => {
    const rRef = doc(db, 'rickshaws', rickshaw.id);
    const rSnap = await tx.get(rRef);
    if (!rSnap.exists()) throw new Error('Rickshaw not found');
    const s = rSnap.data() as any;
    const currentAbsent: number = s.absent || 0;
    const currentCredit: number = s.credit || 0;
    const history: HistoryEntry[] = s.history || [];

    const finalDays = Math.min(daysAgainstOwed, currentAbsent);
    const newAbsent = currentAbsent - finalDays;
    // Agar baqaya poora clear ho gaya (0 reh gaya) tabhi extra Rs advance banega.
    const creditToAdd = newAbsent === 0 ? extraRs : 0;
    const newCredit = currentCredit + creditToAdd;
    const totalCounted = finalDays * rate + creditToAdd;

    const newHistory = [
      ...history,
      {
        date: cycleDateStr(new Date()),
        manual: true,
        delta: -finalDays,
        paidOff: true,
        ...(creditToAdd > 0 ? { creditAdded: creditToAdd } : {}),
      } as HistoryEntry,
    ];

    tx.update(rRef, { absent: newAbsent, credit: newCredit, history: newHistory });

    const pRef = doc(collection(db, 'payments'), cid);
    tx.set(pRef, {
      rickshawId: rickshaw.numberId,
      days: finalDays,
      amount: totalCounted,
      ...(creditToAdd > 0 ? { creditAdded: creditToAdd } : {}),
      date: cycleDateStr(new Date()),
      time: new Date().toISOString(),
    });
  });

  return { ok: true };
}

/** Galti se hui payment cancel karta hai — baqaya din (aur agar advance bana tha wo bhi) wapas ho jata hai. */
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
        const creditAdded = payment.creditAdded || 0;

        const newHistory = [
          ...history,
          {
            date: cycleDateStr(new Date()),
            manual: true,
            delta: payment.days,
            ...(creditAdded > 0 ? { creditUsed: creditAdded } : {}),
          } as HistoryEntry,
        ];

        tx.update(rRef, {
          absent: currentAbsent + payment.days,
          credit: Math.max(0, currentCredit - creditAdded),
          history: newHistory,
        });
      }
    }
    const pRef = doc(db, 'payments', payment.id);
    tx.delete(pRef);
  });

  return { restored: !!match };
}