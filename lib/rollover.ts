import { collection, doc, getDocs, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { addDaysStr, cycleDateStr, daysBetween, rateFor, isMonthly } from './utils';
import { HistoryEntry, RickshawType } from './types';

const VALID_TYPES: RickshawType[] = ['rickshaw', 'redi', 'bike', 'chinchi'];
const DAYS_PER_MONTH_CYCLE = 30; // bike ka "mahina" 30 din ke barabar gina jata hai

/**
 * Har roz raat 2 baje (jab bhi koi device app kholta hai) har rickshaw/redi ka
 * baqaya din +1 karta hai — is baat se qata nazar ke wo rickshaw "Aa Gaya"
 * mark hua ya nahi (attendance ka paisay se koi taluq nahi). Agar us
 * rickshaw ka advance (credit) hai, to pehle usi se naye din ka charge
 * kaata jata hai (history mein "Paid" dikhta hai) — warna baqaya badhta hai
 * (history mein "Nahi Diya" dikhta hai). Firestore transaction istemal
 * hota hai taake agar 2 devices ek sath check karein to rollover sirf ek
 * dafa ho (meta/rollover doc "lock" ka kaam karta hai).
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
      // BUG FIX: pehle yahan har type ko 'redi'/'rickshaw' bana diya jata
      // tha — is wajah se Bike/Chinchi ka rate/monthly-hisaab kabhi sahi
      // nahi lagta tha, hamesha Rickshaw ki tarah treat hota tha.
      const type: RickshawType = VALID_TYPES.includes(s.type) ? s.type : 'rickshaw';
      const rate = rateFor({ type, rate: s.rate });
      const monthly = isMonthly(type);
      let cycleDay: number = s.cycleDay || 0;

      for (let i = 0; i < diffDays; i++) {
        const closingStr = addDaysStr(lastStr, i);

        if (monthly) {
          // Bike: sirf har 30 din poore hone par ek "mahina" charge/entry
          // banta hai — beech ke din history mein nahi aate (unka koi
          // paisa wala event nahi hota).
          cycleDay += 1;
          if (cycleDay >= DAYS_PER_MONTH_CYCLE) {
            cycleDay = 0;
            let paidThatCycle: boolean;
            if (credit >= rate) {
              credit -= rate;
              paidThatCycle = true; // advance/credit se is mahine ka paisa cover ho gaya
            } else {
              absent += 1;
              paidThatCycle = false; // paisa nahi mila, baqaya mahina bana
            }
            history = [...history, { date: closingStr, paid: paidThatCycle }];
          }
        } else {
          // BUG FIX: pehle "Paid"/"Nahi Diya" is baat se tay hota tha ke
          // rickshaw "Aa Gaya" mark hua ya nahi — jo sirf attendance hai,
          // paisa nahi! Ab yeh sirf isi se tay hota hai ke us din ka
          // charge paisay (advance/credit) se cover hua ya baqaya bana.
          let paidThatDay: boolean;
          if (credit >= rate) {
            credit -= rate; // Advance se yeh din poora cover ho gaya
            paidThatDay = true;
          } else {
            absent += 1; // naye din ka naya charge — paisa nahi mila
            paidThatDay = false;
          }
          history = [...history, { date: closingStr, paid: paidThatDay }];
        }
      }
      status = 'A';

      const update: any = { absent, credit, status, history };
      if (monthly) update.cycleDay = cycleDay;
      tx.update(freshSnap.ref, update);
    });

    tx.set(metaRef, { lastRolloverDate: nowStr });
  });
}