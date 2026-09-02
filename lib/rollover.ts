import { collection, doc, getDocs, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { addDaysStr, cycleDateStr, daysBetween, rateFor } from './utils';
import { HistoryEntry, RickshawType } from './types';

/**
 * Har roz raat 2 baje (jab bhi koi device app kholta hai) har rickshaw/redi ka
 * baqaya din +1 karta hai — chahe pichla din paid ho ya na ho. Agar us
 * rickshaw ka advance (credit) hai, to pehle usi se naye din ka charge
 * kaata jata hai — baqaya sirf tab badhta hai jab advance khatam ho jaye.
 * Firestore transaction istemal hota hai taake agar 2 devices ek sath check
 * karein to rollover sirf ek dafa ho (meta/rollover doc "lock" ka kaam karta hai).
 */
export async function runDailyRollover(): Promise<void> {
  const metaRef = doc(db, 'meta', 'rollover');
  const rickshawsSnap = await getDocs(collection(db, 'rickshaws'));
  const nowStr = cycleDateStr(new Date());

  await runTransaction(db, async (tx) => {
    const metaDoc = await tx.get(metaRef);
    const lastStr: string | null = metaDoc.exists() ? (metaDoc.data().lastRolloverDate as string) : null;

    if (!lastStr) {
      // Pehli dafa — sirf aaj ki tareekh record karein, rollover nahi.
      tx.set(metaRef, { lastRolloverDate: nowStr });
      return;
    }

    const diffDays = daysBetween(lastStr, nowStr);
    if (diffDays <= 0) return;

    // Reads pehle, phir writes — Firestore transaction ka usool.
    const freshDocs = await Promise.all(rickshawsSnap.docs.map((d) => tx.get(d.ref)));

    freshDocs.forEach((freshSnap) => {
      if (!freshSnap.exists()) return;
      const s = freshSnap.data() as any;
      let absent: number = s.absent || 0;
      let credit: number = s.credit || 0;
      let status: string = s.status || 'A';
      let history: HistoryEntry[] = s.history || [];
      const type: RickshawType = s.type === 'redi' ? 'redi' : 'rickshaw';
      const rate = rateFor({ type });

      for (let i = 0; i < diffDays; i++) {
        const closingStr = addDaysStr(lastStr, i);
        // i === 0 → jo din abhi khatam hua, uska asli status. Pehle ke
        // missed din (app band thi) unpaid maane jate hain.
        const paidThatDay = i === 0 ? status === 'P' : false;
        history = [...history, { date: closingStr, paid: paidThatDay }];

        if (credit >= rate) {
          // Advance se yeh din poora cover ho gaya — baqaya nahi badhta.
          credit -= rate;
        } else {
          absent += 1; // naye din ka naya charge — chahe pichla din paid ho ya na ho
        }
        status = 'A';
      }

      tx.update(freshSnap.ref, { absent, credit, status, history });
    });

    tx.set(metaRef, { lastRolloverDate: nowStr });
  });
}