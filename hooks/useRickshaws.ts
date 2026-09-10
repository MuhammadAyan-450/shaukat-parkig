'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Rickshaw, RickshawType } from '@/lib/types';
import { naturalCompare, rateFor } from '@/lib/utils';

const VALID_TYPES: RickshawType[] = ['rickshaw', 'redi', 'bike', 'chinchi'];

export function useRickshaws() {
  const [rickshaws, setRickshaws] = useState<Rickshaw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'rickshaws'),
      (snap) => {
        const list: Rickshaw[] = snap.docs.map((d) => {
          const data = d.data() as any;
          // BUG FIX: pehle yahan har type ko sirf 'redi'/'rickshaw' bana diya
          // jata tha — isliye Bike aur Chinchi hamesha "Rickshaw" tab mein
          // chali jati thi aur filter kaam nahi karta tha.
          const type: RickshawType = VALID_TYPES.includes(data.type) ? data.type : 'rickshaw';
          return {
            id: d.id,
            numberId: data.numberId,
            type,
            label: typeof data.label === 'string' ? data.label : undefined,
            absent: data.absent || 0,
            credit: data.credit || 0,
            status: data.status === 'P' ? 'P' : 'A',
            history: Array.isArray(data.history) ? data.history : [],
            rate: typeof data.rate === 'number' && data.rate > 0 ? data.rate : rateFor({ type }),
            cycleDay: typeof data.cycleDay === 'number' ? data.cycleDay : 0,
          };
        });
        list.sort((a, b) => naturalCompare(a.numberId, b.numberId));
        setRickshaws(list);
        setLoading(false);
      },
      (err) => {
        console.error('rickshaws listener error', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { rickshaws, loading };
}