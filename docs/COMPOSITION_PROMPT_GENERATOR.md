# MotionCraft Script-to-JSON Prompt Generator

Gunakan panduan dan prompt di bawah ini pada AI favoritmu (**ChatGPT, Claude, Gemini, DeepSeek, dll**) bersama **naskah, storyboard, materi, atau teks video milikmu sendiri**.

AI akan otomatis:
1. Membaca naskah bebasmu (hasil tulisan sendiri, scriptwriter, atau AI lain).
2. Memecahnya menjadi scene-scene visual Motion Graphics yang dinamis.
3. Memilihkan elemen visual yang paling cocok (headline kinetic, bullet points, angka metrik/data, komparasi before-after, foto/media, hingga CTA).
4. Menghitung durasi frame otomatis (30 frame = 1 detik).
5. Mengeluarkan **RAW JSON** yang siap di-load ke MotionCraft Studio.

---

## 🚀 CARA PAKAI (3 LANGKAH MUDAH)

1. **Copy Prompt Konverter** di bawah ini.
2. **Tempel naskah/materi videomu** pada bagian `[TEMPEL NASKAH/MATERI KAMU DI SINI]`.
3. Kirim ke ChatGPT / Claude. Salin JSON yang dihasilkan, lalu di MotionCraft Studio:
   - Klik **Edit JSON** di header atas
   - Paste JSON
   - Klik **Terapkan**
   - Klik **Render Video** ✨

---

## 📋 PROMPT MASTER KONVERTER (Copy teks di bawah ini ke ChatGPT / Claude)

```markdown
Kamu adalah MotionCraft Script-to-JSON Converter.
Tugasmu adalah mengonversi NASKAH / MATERI VIDEO dari pengguna menjadi format `composition.json` yang siap dirender oleh MotionCraft Studio (engine Remotion).

Berikut adalah naskah / materi video yang ingin diubah menjadi video:
"""
[TEMPEL NASKAH/MATERI KAMU DI SINI]
"""

=== PANDUAN KONVERSI KE SCENE ===

1. Analisis naskah di atas dan pecah menjadi urutan scene yang logis (biasanya 3 - 8 scene tergantung panjang materi).
2. Setiap scene WAJIB memiliki:
   - "tag": Label babak kecil di atas (contoh: "01 / INTRO", "FAKTA MENARIK", "TIPS #1", "SOLUSI", "KESIMPULAN").
   - "headline": Kalimat kunci atau judul scene yang punchy dan to-the-point. Bubuhi tanda *bintang* pada 1-2 kata penting yang ingin di-highlight warna aksen (contoh: "Pernah kepikiran *rahasia ini?*").
   - "subtext": Kalimat narasi atau penjelasan yang dibacakan / ditampilkan (1-2 kalimat ringkas).
   - "durationFrames": Durasi scene dalam frames (standar 30 frames = 1 detik):
     * Scene pendek / Hook pembuka: 90 - 120 frames (3 - 4 detik)
     * Scene sedang / Penjelasan: 150 - 210 frames (5 - 7 detik)
     * Scene padat poin / data: 180 - 240 frames (6 - 8 detik)

3. Elemen Visual Khusus (Gunakan sesuai konteks materi naskah):
   - Jika materi menyebut daftar poin / langkah / tips:
     Tambahkan field: "points": ["Poin 1", "Poin 2", "Poin 3"]
   - Jika materi menyebut data angka / persentase / statistik:
     Tambahkan field: "metricValue": 85 (atau "10x"), "metricLabel": "Peningkatan Efisiensi"
   - Jika materi membandingkan dua hal (lama vs baru, salah vs benar):
     Tambahkan field: "itemsBad": ["Cara Lama 1", "Cara Lama 2"], "itemsGood": ["Cara Baru 1", "Cara Baru 2"]
   - Jika materi adalah scene penutup / ajakan aksi (Call to Action):
     Tambahkan field: "ctaText": "Follow & Coba Sekarang!", "badges": ["Gratis", "Link di Bio"]
   - Jika materi menyebut foto / screenshot / visual:
     Tambahkan field: "mediaUrl": "" (biarkan string kosong atau isi URL jika ada)
   - Jika materi adalah codingan / terminal CLI:
     Tambahkan field: "codeSnippet": "npm install ...", "language": "bash"

4. Pilih Salah Satu Style Visual yang Paling Sesuai:
   - "pi-v2-dark"      : Gelap modern & neon glow (cocok: tech, AI, startup, edukasi digital) [DEFAULT]
   - "remotion-light"  : Putih bersih & cyan (cocok: tutorial SaaS, presentasi korporat)
   - "warm-paper"      : Hangat kertas editorial (cocok: kuliner, kesehatan, lifestyle, buku)
   - "mono-editorial"  : Hitam putih minimalis (cocok: finance, quote bijak, hukum, opini)
   - "sunset-creator"  : Oranye flame energetik (cocok: podcast, motivasi, kreator konten)
   - "tech-neon-soft"  : Hijau terminal cyber (cocok: koding, devops, keamanan siber)
   - "hyper-crypto"    : Ungu neon vibrant (cocok: fintech, web3, luxury tech)

5. Format Output:
   Keluarkan HANYA RAW JSON (valid JSON murni). JANGAN tambahkan kata pengantar, penjelasan, maupun markdown fence ```json.

=== FORMAT OUTPUT WAJIB ===
{
  "title": "Judul Ringkas Video",
  "style": "pi-v2-dark",
  "fps": 30,
  "scenes": [
    {
      "tag": "01 / HOOK",
      "headline": "Judul Scene dengan *Highlight*",
      "subtext": "Kalimat narasi scene ini.",
      "durationFrames": 120
    }
  ]
}
```

---

## 💡 CONTOH PENGGUNAAN NYATA

### Contoh 1: Naskah Edukasi Kesehatan / Lifestyle
**Input Naskah yang ditempel user ke AI:**
> Naskah video:  
> Judul: 3 Bahaya Kurang Tidur bagi Otak  
> Pembuka: Jangan sepelekan begadang! Kurang tidur 1 malam saja bisa menurunkan fokus otak hingga 40%.  
> Bahaya 1: Penurunan daya ingat jangka pendek karena otak gagal membersihkan racun metabolik.  
> Bahaya 2: Risiko emosi tidak stabil dan lonjakan hormon stres kortisol.  
> Bahaya 3: Penurunan sistem kekebalan tubuh hingga 70%.  
> Penutup: Mulai malam ini jadwalkan tidur 7-8 jam. Share video ini ke teman kamu yang hobi begadang!

**Output JSON yang dihasilkan AI:**
```json
{
  "title": "3 Bahaya Kurang Tidur bagi Otak",
  "style": "warm-paper",
  "fps": 30,
  "scenes": [
    {
      "tag": "01 / PERINGATAN",
      "headline": "Jangan Sepelekan *Kebiasaan Begadang!*",
      "subtext": "Kurang tidur satu malam saja sudah cukup untuk mengacaukan fungsi otak kamu.",
      "metricValue": 40,
      "metricLabel": "Penurunan Fokus Otak (%)",
      "durationFrames": 150
    },
    {
      "tag": "02 / DAMPAK UTAMA",
      "headline": "3 Dampak Fatal *Kurang Tidur*",
      "subtext": "Otak dan tubuhmu mengalami degradasi tanpa istirahat yang cukup.",
      "points": [
        "Daya ingat jangka pendek merosot drastis",
        "Lonjakan hormon stres kortisol memicu kecemasan",
        "Sistem imun tubuh melemah hingga 70%"
      ],
      "durationFrames": 210
    },
    {
      "tag": "03 / AJAKAN",
      "headline": "Prioritaskan *7-8 Jam Tidur* Mulai Malam Ini",
      "subtext": "Kesehatan otakmu adalah investasi paling berharga untuk masa depan.",
      "ctaText": "Share ke teman yang suka begadang!",
      "badges": ["Tips Sehat", "Tidur Cukup"],
      "durationFrames": 150
    }
  ]
}
```

---

### Contoh 2: Naskah Produk / Review Aplikasi Bisnis
**Input Naskah yang ditempel user ke AI:**
> Naskah:  
> Capek rekap orderan manual satu-satu di WhatsApp?  
> Sebelum pakai KasirKilat: Catat buku manual, rawan selisih uang, laporan bulanan butuh 3 hari.  
> Sesudah pakai KasirKilat: Semua otomatis, cetak struk via bluetooth, laporan keuangan selesai dalam 5 detik.  
> Sudah dipakai lebih dari 15.000 UMKM di seluruh Indonesia.  
> Download KasirKilat sekarang di Play Store, gratis 30 hari pertama!

**Output JSON yang dihasilkan AI:**
```json
{
  "title": "Revolusi Kasir Toko Modern",
  "style": "pi-v2-dark",
  "fps": 30,
  "scenes": [
    {
      "tag": "01 / MASALAH",
      "headline": "Masih Rekap Orderan *Secara Manual?*",
      "subtext": "Waktumu terlalu berharga untuk dihabiskan mengurus catatan kertas.",
      "durationFrames": 120
    },
    {
      "tag": "02 / PERBANDINGAN",
      "headline": "Metode Jadul vs *KasirKilat*",
      "subtext": "Transformasi instan dari catatan kertas ke sistem cerdas digital.",
      "itemsBad": [
        "Buku nota manual rawan hilang",
        "Sering selisih hitung kembalian",
        "Laporan bulanan makan waktu 3 hari"
      ],
      "itemsGood": [
        "Transaksi otomatis tercatat real-time",
        "Cetak struk kilat via printer bluetooth",
        "Laporan keuangan instan dalam 5 detik"
      ],
      "durationFrames": 240
    },
    {
      "tag": "03 / BUKTI NYATA",
      "headline": "Dipercaya Oleh *Ribuan Pengusaha*",
      "subtext": "Bergabunglah bersama ribuan toko yang telah mengotomasi bisnis mereka.",
      "metricValue": "15,000+",
      "metricLabel": "UMKM Aktif di Indonesia",
      "durationFrames": 150
    },
    {
      "tag": "04 / COBA SEKARANG",
      "headline": "Download *KasirKilat* Hari Ini",
      "subtext": "Tingkatkan efisiensi tokomu mulai hari ini juga.",
      "ctaText": "Coba Gratis 30 Hari di Play Store",
      "badges": ["Gratis 30 Hari", "Tanpa Kartu Kredit"],
      "durationFrames": 150
    }
  ]
}
```

---

## 🎯 FIELD-FIELD LENGKAP YANG DIDUKUNG TOOLS

Berikut ringkasan semua field yang dipahami oleh MotionCraft Studio:

| Field | Tipe | Keterangan |
|---|---|---|
| `title` | string | Judul video |
| `style` | string | `pi-v2-dark`, `remotion-light`, `warm-paper`, `mono-editorial`, dll |
| `fps` | number | Standar `30` |
| `scenes[].tag` | string | Label kecil di atas (misal: `"01 / HOOK"`) |
| `scenes[].headline` | string | Teks utama di layar. Gunakan `*bintang*` untuk highlight |
| `scenes[].subtext` | string | Kalimat narasi / penjelasan |
| `scenes[].durationFrames` | number | Durasi scene dalam frames (30 = 1 detik) |
| `scenes[].points` | string[] | Array poin list (2–4 poin) |
| `scenes[].metricValue` | number / string | Angka besar penarik perhatian (misal: `85`, `"10x"`) |
| `scenes[].metricLabel` | string | Keterangan angka metrik |
| `scenes[].itemsBad` | string[] | Poin sisi kiri (metode lama/masalah) |
| `scenes[].itemsGood` | string[] | Poin sisi kanan (metode baru/solusi) |
| `scenes[].ctaText` | string | Teks tombol ajakan bertindak (CTA) |
| `scenes[].badges` | string[] | Label tambahan pada outro (misal: `["Gratis", "Link di Bio"]`) |
| `scenes[].mediaUrl` | string | URL gambar/video jika ingin menampilkan media |
| `scenes[].codeSnippet` | string | Kode kodingan/terminal jika ada |
