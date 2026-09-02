export type RickshawType = 'rickshaw' | 'redi';
export type Status = 'A' | 'P';

export interface HistoryEntry {
  date: string;        // 'YYYY-MM-DD'
  paid?: boolean;       // auto daily rollover entry (paid that day or not)
  manual?: boolean;     // manual stepper correction
  delta?: number;       // +/- din
  paidOff?: boolean;    // came from the "Paid" button
  creditAdded?: number; // Rs advance jama hua is entry mein (agar overpay hua)
  creditUsed?: number;  // Rs advance se is entry mein kitna use hua
}

export interface Rickshaw {
  id: string;           // Firestore doc id
  numberId: string;     // display number / naam
  type: RickshawType;
  absent: number;       // baqaya din
  credit: number;       // Rs advance (jama) — jab payment baqaya se zyada mile
  status: Status;       // 'A' = pending, 'P' = aa gaya
  history: HistoryEntry[];
}

export interface Payment {
  id: string;            // Firestore doc id
  rickshawId: string;    // numberId at the time of payment
  days: number;
  amount: number;
  creditAdded?: number;  // agar overpay hua to kitna Rs advance bana
  date: string;          // cycle date 'YYYY-MM-DD'
  time: string;           // ISO timestamp
}