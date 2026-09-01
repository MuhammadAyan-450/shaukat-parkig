'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Payment } from '@/lib/types';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'payments'), orderBy('time', 'desc'), limit(500));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Payment[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            rickshawId: data.rickshawId,
            days: data.days || 0,
            amount: data.amount || 0,
            date: data.date,
            time: data.time,
          };
        });
        setPayments(list);
        setLoading(false);
      },
      (err) => {
        console.error('payments listener error', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { payments, loading };
}
