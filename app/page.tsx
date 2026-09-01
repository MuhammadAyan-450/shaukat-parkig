'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRickshaws } from '@/hooks/useRickshaws';
import { usePayments } from '@/hooks/usePayments';
import { Rickshaw, Payment, RickshawType } from '@/lib/types';
import { cycleDateStr, naturalCompare } from '@/lib/utils';
import { runDailyRollover } from '@/lib/rollover';
import {
  addRickshaw,
  deleteRickshaw,
  renameRickshaw,
  markAaya,
  restoreToPending,
  setAbsentManual,
  markPaid,
  undoPayment,
} from '@/lib/actions';
import { downloadBackup, restoreBackup } from '@/lib/backup';
import { exportBaqayaPng } from '@/lib/pngExport';

import TypeTabs, { TabValue } from '@/components/TypeTabs';
import StaffRow from '@/components/StaffRow';
import StepperModal from '@/components/modals/StepperModal';
import PaidModal from '@/components/modals/PaidModal';
import AayaModal from '@/components/modals/AayaModal';
import DeleteModal from '@/components/modals/DeleteModal';
import EditModal from '@/components/modals/EditModal';
import AddModal from '@/components/modals/AddModal';
import HistoryModal from '@/components/modals/HistoryModal';
import DoneListModal from '@/components/modals/DoneListModal';
import CollectionModal from '@/components/modals/CollectionModal';

export default function HomePage() {
  const { rickshaws, loading } = useRickshaws();
  const { payments } = usePayments();
  const [online, setOnline] = useState(true);

  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [stepperTarget, setStepperTarget] = useState<Rickshaw | null>(null);
  const [paidTarget, setPaidTarget] = useState<Rickshaw | null>(null);
  const [aayaTarget, setAayaTarget] = useState<Rickshaw | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rickshaw | null>(null);
  const [editTarget, setEditTarget] = useState<Rickshaw | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Rickshaw | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDoneList, setShowDoneList] = useState(false);
  const [showCollection, setShowCollection] = useState(false);

  const restoreFileRef = useRef<HTMLInputElement>(null);
  const didRollover = useRef(false);

  useEffect(() => {
    function goOnline() { setOnline(true); }
    function goOffline() { setOnline(false); }
    setOnline(navigator.onLine);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Roz raat 2 baje ka rollover — jab bhi app khulti hai check hota hai.
  useEffect(() => {
    if (didRollover.current) return;
    didRollover.current = true;
    runDailyRollover().catch((err) => console.error('rollover failed', err));
  }, []);

  const todayStr = cycleDateStr(new Date());
  const todaysPayments = useMemo(
    () => payments.filter((p) => p.date === todayStr),
    [payments, todayStr]
  );
  const todayTotal = useMemo(
    () => todaysPayments.reduce((sum, p) => sum + p.amount, 0),
    [todaysPayments]
  );

  const tabFiltered = useMemo(
    () => (activeTab === 'all' ? rickshaws : rickshaws.filter((r) => r.type === activeTab)),
    [rickshaws, activeTab]
  );
  const pendingList = useMemo(
    () =>
      tabFiltered
        .filter((r) => r.status !== 'P')
        .filter((r) => !searchTerm || r.numberId.toLowerCase().includes(searchTerm.trim().toLowerCase()))
        .sort((a, b) => naturalCompare(a.numberId, b.numberId)),
    [tabFiltered, searchTerm]
  );
  const doneList = useMemo(() => tabFiltered.filter((r) => r.status === 'P'), [tabFiltered]);

  // Modal state captures the rickshaw object at the moment it was opened.
  // If another device changes it (or a rollover runs) while the modal is
  // open, this keeps the modal showing the latest data instead of a stale copy.
  function live(r: Rickshaw): Rickshaw {
    return rickshaws.find((x) => x.id === r.id) || r;
  }

  const placeholder =
    activeTab === 'redi' ? `${pendingList.length} Redi` : activeTab === 'rickshaw' ? `${pendingList.length} Rickshaw` : `${pendingList.length} Rickshaw/Redi`;

  async function handleAdd(numberId: string, type: RickshawType) {
    await addRickshaw(numberId, type);
  }

  async function handleUndo(payment: Payment) {
    await undoPayment(payment, rickshaws);
  }

  async function handleBackup() {
    downloadBackup(rickshaws, payments);
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await restoreBackup(file);
      alert('Backup restore ho gayi.');
    } catch (err) {
      alert('Ye file sahi backup nahi hai.');
    }
    e.target.value = '';
  }

  return (
    <div className="wrap">
      <div className="header">
        Meri Rickshaw Parking
        <div className="header-sub">Roz ki attendance aur baqaya</div>
      </div>

      <div className={'sync-status ' + (online ? 'online' : 'offline')}>
        <span className={'sync-dot' + (online ? '' : ' offline')}></span>
        {online ? 'Live sync chalu hai' : 'Offline — internet aane par sync ho jayega'}
      </div>

      <TypeTabs active={activeTab} onChange={setActiveTab} />

      <div className="search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="toolbar">
        <button className="pill-btn green" onClick={() => setShowDoneList(true)}>
          ✅ Aa Chuke ({doneList.length})
        </button>
        <button className="pill-btn green" onClick={() => setShowCollection(true)}>
          💰 Aaj: Rs {todayTotal}
        </button>
        <button className="pill-btn" onClick={() => exportBaqayaPng(rickshaws, activeTab)}>
          🖼 PNG Banayen
        </button>
        <button className="pill-btn" onClick={handleBackup}>
          ⬇ Backup
        </button>
        <button className="pill-btn" onClick={() => restoreFileRef.current?.click()}>
          ⬆ Restore
        </button>
        <input
          type="file"
          accept=".json"
          ref={restoreFileRef}
          style={{ display: 'none' }}
          onChange={handleRestoreFile}
        />
      </div>

      <div className="list">
        {loading ? (
          <div className="empty">Load ho raha hai...</div>
        ) : rickshaws.length === 0 ? (
          <div className="empty">Abhi koi rickshaw nahi hai. Neeche &quot;Add Karein&quot; par tap karein.</div>
        ) : pendingList.length === 0 ? (
          <div className="empty">Koi rickshaw nahi mila.</div>
        ) : (
          pendingList.map((r) => (
            <StaffRow
              key={r.id}
              rickshaw={r}
              onOpenStepper={() => setStepperTarget(r)}
              onAaya={() => setAayaTarget(r)}
              onDelete={() => setDeleteTarget(r)}
              onEdit={() => setEditTarget(r)}
              onHistory={() => setHistoryTarget(r)}
              onPaid={() => setPaidTarget(r)}
            />
          ))
        )}
      </div>

      <div className="footer">
        <button className="btn-add" onClick={() => setShowAdd(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          ADD KAREIN
        </button>
      </div>

      {stepperTarget && (
        <StepperModal
          rickshaw={live(stepperTarget)}
          onClose={() => setStepperTarget(null)}
          onSave={(val) => setAbsentManual(live(stepperTarget), val)}
        />
      )}

      {paidTarget && (
        <PaidModal
          rickshaw={live(paidTarget)}
          onClose={() => setPaidTarget(null)}
          onConfirm={(rs) => markPaid(live(paidTarget), rs)}
        />
      )}

      {aayaTarget && (
        <AayaModal
          rickshaw={live(aayaTarget)}
          onClose={() => setAayaTarget(null)}
          onConfirm={() => markAaya(aayaTarget.id)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          rickshaw={live(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteRickshaw(deleteTarget.id)}
        />
      )}

      {editTarget && (
        <EditModal
          rickshaw={live(editTarget)}
          onClose={() => setEditTarget(null)}
          onSave={(newId) => renameRickshaw(editTarget.id, newId)}
        />
      )}

      {historyTarget && (
        <HistoryModal
          rickshaw={live(historyTarget)}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {showAdd && (
        <AddModal
          existingIds={rickshaws.map((r) => r.numberId)}
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
        />
      )}

      {showDoneList && (
        <DoneListModal
          rickshaws={doneList}
          onClose={() => setShowDoneList(false)}
          onRestore={(r) => restoreToPending(r.id)}
        />
      )}

      {showCollection && (
        <CollectionModal
          payments={todaysPayments}
          onClose={() => setShowCollection(false)}
          onUndo={handleUndo}
        />
      )}
    </div>
  );
}
