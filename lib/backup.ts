import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Rickshaw, Payment } from './types';

export function downloadBackup(rickshaws: Rickshaw[], payments: Payment[]) {
  const payload = {
    staff: rickshaws.map((r) => ({
      id: r.numberId,
      type: r.type,
      absent: r.absent,
      credit: r.credit || 0,
      status: r.status,
      history: r.history,
    })),
    collections: payments.map((p) => ({
      rickshawId: p.rickshawId,
      days: p.days,
      amount: p.amount,
      creditAdded: p.creditAdded || 0,
      date: p.date,
      time: p.time,
    })),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `meri-parking-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Poora Firestore data (rickshaws + payments) is JSON se replace kar deta hai.
// Chunked batches (Firestore ki 500-writes/batch limit ke wajah se).
export async function restoreBackup(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!Array.isArray(data.staff)) throw new Error('invalid file');

  const rickshawsSnap = await getDocs(collection(db, 'rickshaws'));
  const paymentsSnap = await getDocs(collection(db, 'payments'));

  const deletions = [...rickshawsSnap.docs, ...paymentsSnap.docs];
  for (let i = 0; i < deletions.length; i += 400) {
    const batch = writeBatch(db);
    deletions.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  const newRickshaws = data.staff as any[];
  for (let i = 0; i < newRickshaws.length; i += 400) {
    const batch = writeBatch(db);
    newRickshaws.slice(i, i + 400).forEach((s) => {
      const ref = doc(collection(db, 'rickshaws'));
      batch.set(ref, {
        numberId: s.id,
        type: s.type === 'redi' ? 'redi' : 'rickshaw',
        absent: s.absent || 0,
        credit: s.credit || 0,
        status: s.status === 'P' ? 'P' : 'A',
        history: Array.isArray(s.history) ? s.history : [],
      });
    });
    await batch.commit();
  }

  const newPayments = Array.isArray(data.collections) ? (data.collections as any[]) : [];
  for (let i = 0; i < newPayments.length; i += 400) {
    const batch = writeBatch(db);
    newPayments.slice(i, i + 400).forEach((c) => {
      const ref = doc(collection(db, 'payments'));
      batch.set(ref, {
        rickshawId: c.rickshawId,
        days: c.days || 0,
        amount: c.amount || 0,
        creditAdded: c.creditAdded || 0,
        date: c.date,
        time: c.time || new Date().toISOString(),
      });
    });
    await batch.commit();
  }
}

export async function deleteAllData(): Promise<void> {
  const rickshawsSnap = await getDocs(collection(db, 'rickshaws'));
  const paymentsSnap = await getDocs(collection(db, 'payments'));
  const all = [...rickshawsSnap.docs, ...paymentsSnap.docs];
  for (let i = 0; i < all.length; i += 400) {
    const batch = writeBatch(db);
    all.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}