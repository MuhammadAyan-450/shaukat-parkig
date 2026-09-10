export type RickshawType = 'rickshaw' | 'redi' | 'bike' | 'chinchi';
export type Status = 'A' | 'P';

export interface HistoryEntry {
  date: string;         // 'YYYY-MM-DD'
  paid?: boolean;        // auto daily rollover entry (paid that day or not)
  manual?: boolean;      // manual stepper correction
  delta?: number;        // +/- din
  paidOff?: boolean;     // came from the "Paid" button
  amount?: number;       // paidOff entries: us waqt asal mein kitna Rs diya gaya tha (rate baad mein badle to bhi yeh fix rehta hai)
  creditDelta?: number;  // is entry se advance/udhaar (credit) mein kitna +/- hua
}

export interface Rickshaw {
  id: string;           // Firestore doc id
  numberId: string;     // display number / naam
  type: RickshawType;
  label?: string;       // extra naam/mol (abhi khaas kar Bike ke liye "Naam ya Mol")
  absent: number;       // baqaya din (bike ke liye: baqaya mahine)
  credit: number;       // Rs — musbat (+) matlab advance/jama, manfi (-) matlab thoda aur udhaar
  status: Status;       // 'A' = pending, 'P' = aa gaya
  history: HistoryEntry[];
  rate: number;         // is khaas gari ka rate (Rs) — har gari ka apna alag ho sakta hai
  cycleDay?: number;    // sirf 'bike' (monthly) ke liye — is mahine ke cycle mein kitne din guzray
}

export interface Payment {
  id: string;            // Firestore doc id
  rickshawId: string;    // numberId at the time of payment
  days: number;           // kitne poore din baqaya se kam huay
  amount: number;         // total Rs diya gaya
  creditDelta?: number;   // is payment se credit mein +/- kitna hua (round-off ka farq)
  date: string;          // cycle date 'YYYY-MM-DD'
  time: string;           // ISO timestamp
}