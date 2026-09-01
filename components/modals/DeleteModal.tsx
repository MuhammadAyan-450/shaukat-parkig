'use client';

import { Rickshaw } from '@/lib/types';

export default function DeleteModal({
  rickshaw,
  onClose,
  onConfirm,
}: {
  rickshaw: Rickshaw;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stepper-card">
        <div className="stepper-title">Rickshaw Delete Karein</div>
        <div className="stepper-id">{rickshaw.numberId}</div>
        <div className="stepper-note" style={{ marginBottom: 18 }}>
          Kya aap is rickshaw ko delete karna chahte hain?
        </div>
        <div className="confirm-row">
          <button className="btn-cancel" onClick={onClose}>
            Nahi
          </button>
          <button
            className="btn-danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Haan
          </button>
        </div>
      </div>
    </div>
  );
}
