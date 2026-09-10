import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Note {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export function subscribeNotes(cb: (notes: Note[]) => void) {
  return onSnapshot(collection(db, 'notes'), (snap) => {
    const list: Note[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        text: typeof data.text === 'string' ? data.text : '',
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || data.createdAt || '',
      };
    });
    list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    cb(list);
  });
}

/** Naya note banata hai aur uski id wapas deta hai. */
export async function createNote(text: string): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'notes'), {
    text,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateNote(id: string, text: string) {
  await updateDoc(doc(db, 'notes', id), { text, updatedAt: new Date().toISOString() });
}

export async function deleteNote(id: string) {
  await deleteDoc(doc(db, 'notes', id));
}
