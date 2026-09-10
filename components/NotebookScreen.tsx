'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Note, subscribeNotes, createNote, updateNote, deleteNote } from '@/lib/notebook';

function formatWhen(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Aaj, ${time}`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + time;
}

function firstLine(text: string): string {
  const line = text.split('\n').find((l) => l.trim().length > 0);
  return line ? line.trim() : 'Naya Note';
}

export default function NotebookScreen({ onClose }: { onClose: () => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null); // null = list view, 'new' = naya note, else existing id
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = subscribeNotes((list) => {
      setNotes(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(
    () =>
      !search.trim()
        ? notes
        : notes.filter((n) => n.text.toLowerCase().includes(search.trim().toLowerCase())),
    [notes, search]
  );

  function openNew() {
    setDraft('');
    setOpenId('new');
  }

  function openExisting(n: Note) {
    setDraft(n.text);
    setOpenId(n.id);
  }

  function scheduleAutosave(id: string, text: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateNote(id, text).catch(() => {});
    }, 700);
  }

  async function handleBack() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (openId === 'new') {
      if (draft.trim()) {
        await createNote(draft);
      }
    } else if (openId) {
      await updateNote(openId, draft);
    }
    setOpenId(null);
    setDraft('');
  }

  function handleChange(text: string) {
    setDraft(text);
    if (openId && openId !== 'new') {
      scheduleAutosave(openId, text);
    }
  }

  async function handleDelete(id: string, preview: string) {
    const ok = confirm(`"${preview}" note delete karein?`);
    if (!ok) return;
    await deleteNote(id);
    if (openId === id) {
      setOpenId(null);
      setDraft('');
    }
  }

  const isEditor = openId !== null;

  return (
    <div className="notebook-screen">
      <div className="notebook-header-bar">
        <button className="notebook-back" onClick={isEditor ? handleBack : onClose}>
          ← Wapas
        </button>
        {!isEditor && <div className="notebook-title-lg">📓 Notebook</div>}
      </div>

      {!isEditor ? (
        <div className="notebook-body">
          <button className="bike-add-btn" onClick={openNew} style={{ marginBottom: 14 }}>
            + Naya Note
          </button>

          {notes.length > 3 && (
            <input
              type="text"
              className="modal-search"
              placeholder="Notes mein dhoondein..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 14 }}
            />
          )}

          {loading ? (
            <div className="empty">Load ho raha hai...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              {search ? 'Koi note nahi mila.' : 'Abhi koi note nahi hai. Upar se naya note likhein.'}
            </div>
          ) : (
            <div className="note-grid">
              {filtered.map((n) => (
                <div className="note-card" key={n.id} onClick={() => openExisting(n)}>
                  <button
                    className="note-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n.id, firstLine(n.text));
                    }}
                    aria-label="Note delete karein"
                  >
                    🗑
                  </button>
                  <div className="note-card-title">{firstLine(n.text)}</div>
                  <div className="note-card-preview">{n.text}</div>
                  <div className="note-card-date">{formatWhen(n.updatedAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="notebook-editor-wrap">
          <textarea
            className="lined-textarea"
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Yahan likhna shuru karein..."
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
