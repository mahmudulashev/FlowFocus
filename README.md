Focus Flow – Weekly Ritual Coach (Web)
=====================================

Focus Flow — brauzer uchun React + Vite yordamida qurilgan ultra-fokus haftalik reja va odatlar menejeri. Ilova barcha maʼlumotlarni foydalanuvchining `localStorage` xotirasida saqlaydi, shuning uchun alohida backend yoki server kerak emas. Shu tarzda GitHub Pages yoki Vercel’ga bepul joylab, istalgan kishi bilan baham ko‘rishingiz mumkin.

Asosiy imkoniyatlar
-------------------

- Haftalik planner – har bir kun va soat uchun vazifalar bloklari, 3 martagacha reschedule limiti.
- Dashboard – joriy vazifa, progress, coin balansi va tezkor qaydlar.
- Habit tracker – odatlar streak’i va coin motivatsiyasi.
- Coin do‘koni – mukofotlar ro‘yxati va balans harakati.
- AI bo‘limi (faqat desktop ilovada mavjud) – brauzer versiyasida qo‘lda eslatmalar yozish uchun joy qoldirilgan.
- Bildirishnomalar – brauzer Notification API orqali (foydalanuvchi ruxsat bergan taqdirda).

Mahalliy ishchi muhit
---------------------

Node.js 18+ versiyasi talab etiladi.

```bash
npm install
npm run dev
```

`npm run dev` – Vite dev serverini ishga tushiradi (`http://localhost:5173`).

Build qilish
------------

```bash
npm run build
npm run preview   # ixtiyoriy, ishlab chiqarish build’ini tekshirish uchun
```

`npm run build` komandasi statik fayllarni `dist/` papkasiga chiqaradi.

Deployment tavsiyasi
--------------------

1. GitHub’da yangi repository oching va loyihani push qiling.
2. Vercel’da yangi Project yarating, manba sifatida GitHub repository’ni tanlang.
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. Deploy tugagach, Vercel avtomatik ravishda HTTPS bilan ishlaydigan bepul URL beradi.

Eslatma: Ilova maʼlumotlarni faqat foydalanuvchi brauzerining `localStorage`ida saqlaydi. Boshqa foydalanuvchilar bilan maʼlumot almashmaydi. Agar brauzer maʼlumotlari tozalansa (Clear storage), ilova boshlang‘ich demodan boshlaydi.

Keyingi g‘oyalar
----------------

- PWA (Progressive Web App) qo‘llab-quvvatlashi, offline rejim va homescreen o‘rnatish uchun.
- Bulut sinxronizatsiyasi (Google Drive / Supabase va h.k.) – ixtiyoriy backend xizmatlari orqali.
- Fokus taymeri yoki Pomodoro integratsiyasi.

Enjoy ultra fokus!
