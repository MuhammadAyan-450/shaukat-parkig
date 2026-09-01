'use client';

import { Rickshaw } from '@/lib/types';

export default function AayaModal({
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
        <div className="stepper-title">Aa Gaya?</div>
        <div className="stepper-id">{rickshaw.numberId}</div>
        <div className="stepper-note" style={{ marginBottom: 18 }}>
          Kya yeh rickshaw aaj aa gaya hai?
        </div>
        <div className="confirm-row">
          <button className="btn-cancel" onClick={onClose}>
            Nahi
          </button>
          <button
            className="btn-confirm"
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
