'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Rickshaw } from '@/lib/types';
import { naturalCompare } from '@/lib/utils';

export function useRickshaws() {
  const [rickshaws, setRickshaws] = useState<Rickshaw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'rickshaws'),
      (snap) => {
        const list: Rickshaw[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            numberId: data.numberId,
            type: data.type === 'redi' ? 'redi' : 'rickshaw',
            absent: data.absent || 0,
            status: data.status === 'P' ? 'P' : 'A',
            history: Array.isArray(data.history) ? data.history : [],
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
