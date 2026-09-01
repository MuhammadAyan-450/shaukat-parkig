export type RickshawType = 'rickshaw' | 'redi';
export type Status = 'A' | 'P';

export interface HistoryEntry {
  date: string;        // 'YYYY-MM-DD'
  paid?: boolean;       // auto daily rollover entry (paid that day or not)
  manual?: boolean;     // manual stepper correction
  delta?: number;       // +/- din
  paidOff?: boolean;    // came from the "Paid" button
}

export interface Rickshaw {
  id: string;           // Firestore doc id
  numberId: string;     // display number / naam
  type: RickshawType;
  absent: number;       // baqaya din
  status: Status;       // 'A' = pending, 'P' = aa gaya
  history: HistoryEntry[];
}

export interface Payment {
  id: string;            // Firestore doc id
  rickshawId: string;    // numberId at the time of payment
  days: number;
  amount: number;
  date: string;          // cycle date 'YYYY-MM-DD'
  time: string;           // ISO timestamp
}
