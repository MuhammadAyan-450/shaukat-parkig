# Meri Rickshaw Parking — Next.js + Firebase

Yeh aapki original app ka Next.js version hai, jisme data **Firebase Firestore**
mein save hota hai. Matlab jis mobile/computer se bhi app kholein, sab jagah
**live** ek hi data dikhega — koi bhi device change kare, doosre sab devices
mein **turant** (real-time) update ho jayega.

Har cheez wahi hai jo purani app mein thi: Rickshaw/Redi tabs, alag rate
(Rickshaw Rs 70/din, Redi Rs 60/din), Aa Gaya confirm popup, Paid button
(Rs amount se din kam), baqaya stepper, payment history, Aaj Ka Collection +
Undo, Wapas Lao confirm, PNG export (0 din / baqaya din), backup/restore.

---

## 1. Firebase project banayein (5 minute, muft)

1. [console.firebase.google.com](https://console.firebase.google.com) par jayein, Google account se login karein.
2. **"Add project"** → koi bhi naam dein (jaise `meri-parking`) → Continue → Continue → **Create project**.
3. Bayen taraf menu se **Build → Firestore Database** par jayein.
4. **"Create database"** dabayein → koi bhi location choose karein (jo aapke qareeb ho) → **"Start in test mode"** select karein → Enable.
   - Test mode ka matlab hai database khula rahega (bina login ke) — yeh isliye
     rakha hai kyunki original app mein bhi koi login nahi tha. Agar aap
     chahte hain ke sirf aap hi access kar sakein, neeche "Security" section
     dekhein.
5. Bayen taraf **⚙️ (gear icon) → Project settings** par jayein.
6. Neeche "Your apps" mein **`</>`** (Web) icon par click karein.
7. App ka koi naam dein (jaise `parking-web`) → **Register app**.
8. Jo `firebaseConfig` object dikhega, usme se values copy kar lein — agle step mein use hongi.

## 2. Project setup karein

1. Yeh zip folder kisi bhi computer mein extract karein.
2. Folder ke andar `.env.local.example` file ka naam badal kar **`.env.local`** kar dein.
3. Usme Firebase console se copy ki hui values bharein:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=meri-parking-xxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=meri-parking-xxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=meri-parking-xxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

4. Terminal (Command Prompt / Terminal app) mein is folder ke andar jayein aur:

```
npm install
npm run dev
```

5. Browser mein **http://localhost:3000** kholein — app chal jayegi.

## 3. Phone/dusre logon tak pohonchana (deploy karna)

Apne computer par hi chalana ho to upar wala step kaafi hai (sirf usi wifi
network par doosre devices `http://<computer-ka-IP>:3000` se access kar
sakte hain). Lekin har jagah (mobile data par bhi) se access karne ke liye,
**Vercel** par free deploy karna sabse aasan hai:

1. [vercel.com](https://vercel.com) par jayein, GitHub se sign up karein (muft).
2. Is project ko GitHub par ek repository bana kar upload karein
   (GitHub Desktop app se ya `git push` se).
3. Vercel mein **"Add New → Project"** → apni GitHub repository select karein.
4. **"Environment Variables"** section mein wahi 6 values dalein jo `.env.local`
   mein dali thi (upar step 2.3).
5. **Deploy** dabayein. 1-2 minute mein aapko ek link mil jayega
   (jaise `meri-parking.vercel.app`) — yeh link kisi bhi mobile mein khol kar
   "Add to Home Screen" karein, bilkul app jaisa chalega.

Ab jis bhi mobile se koi change karega, Firebase ke zariye baqi sab
devices mein **turant** wohi update dikhega — kisi manual sync ki zaroorat
nahi.

---

## Security (zaroori — zaroor parhein)

Upar wale "test mode" rules matlab hai ke jis kisi ke paas yeh link/config
hai woh data padh aur badal sakta hai. Chhote business ke liye (jahan sirf
aap aur aapke chunay huay log link use karte hain) yeh aksar theek hai,
lekin agar zyada mehfooz chahte hain to:

- Link/URL kisi ke saath share na karein sirf apne trusted logon ke.
- Ya `firestore.rules` file mein Firebase Authentication (jaise phone number
  se login) add karwa lein — is ke liye dobara Claude se madad le sakte hain.

## Firestore data structure

- `rickshaws/{id}` — har rickshaw/redi ka record: `numberId`, `type`
  (`rickshaw`/`redi`), `absent` (baqaya din), `status` (`A`/`P`), `history`.
- `payments/{id}` — har payment: `rickshawId`, `days`, `amount`, `date`, `time`.
- `meta/rollover` — sirf ek doc jo track karta hai raat 2 baje wala rollover
  kab last chala tha (taake do devices ek sath double na kar dein).

## Local development commands

```
npm install       # packages install karein (sirf pehli dafa)
npm run dev        # local development server (localhost:3000)
npm run build       # production build banayein
npm run start        # production build ko chalayein
```
