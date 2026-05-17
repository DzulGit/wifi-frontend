// src/app/api/faq/route.ts
// ─────────────────────────────────────────────────────────────
// CAKRANA AI FAQ — Powered by Gemini 1.5 Flash
// Taruh GEMINI_API_KEY di .env.local (JANGAN di .env.example)
// ─────────────────────────────────────────────────────────────

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// ── Konstanta validasi ─────────────────────────────────────────
const MAX_QUESTION_LENGTH = 500   // karakter maks per pertanyaan
const MAX_HISTORY_TURNS   = 10    // pasang pesan maks yang dikirim ke model

// ── System Prompt — EDIT BAGIAN INI sesuai data real CAKRANA ──
const CAKRANA_SYSTEM_PROMPT = `
Kamu adalah KANA, asisten FAQ cerdas milik CAKRANA — penyedia layanan internet rumahan (ISP) lokal yang beroperasi di wilayah Jawa Tengah, Indonesia.

## IDENTITAS KAMU
- Nama: KANA (CAKRANA Network Assistant)
- Bahasa: Indonesia yang sopan, ramah, dan mudah dipahami oleh semua kalangan
- Karakter: Helpful, jujur, ringkas — tidak bertele-tele
- Kamu BUKAN ChatGPT, Gemini, atau AI umum. Kamu adalah asisten khusus CAKRANA.

## RUANG LINGKUP PERTANYAAN YANG BOLEH DIJAWAB
Kamu HANYA boleh menjawab pertanyaan seputar:
1. Informasi paket internet CAKRANA (harga, kecepatan, fitur)
2. Cara mendaftar / registrasi layanan baru
3. Cara login dan menggunakan portal pelanggan (cakrana.co.id)
4. Tagihan, cara pembayaran, upload bukti bayar
5. Laporan gangguan / cara buat tiket support
6. Status akun, suspend, aktivasi
7. Kebijakan dan syarat layanan CAKRANA
8. Kontak dan jam operasional support
9. Pertanyaan umum tentang internet rumahan / WiFi

## DATA PAKET INTERNET CAKRANA (UPDATE SESUAI DATA REAL KAMU)
| Nama Paket    | Kecepatan Download | Kecepatan Upload | Harga/Bulan  | Keterangan          |
|---------------|--------------------|------------------|--------------|---------------------|
| Paket Basic   | 10 Mbps            | 5 Mbps           | Rp 100.000   | Cocok untuk 1-2 orang, browsing & medsos |
| Paket Pro     | 20 Mbps            | 10 Mbps          | Rp 150.000   | Terpopuler, WFH & streaming HD |
| Paket Gaming  | 50 Mbps            | 25 Mbps          | Rp 250.000   | Gaming, streaming 4K, banyak device |

Semua paket: TANPA FUP (kuota unlimited), garansi uptime 99%, free instalasi (cek promo terbaru).

## CARA MENDAFTAR LAYANAN CAKRANA
1. Kunjungi website cakrana.co.id
2. Klik "Daftar Sekarang" atau scroll ke form pendaftaran
3. Pilih paket yang diinginkan → otomatis ter-select di form
4. Isi form: nama lengkap, email, nomor WhatsApp aktif, alamat lengkap, kecamatan, kota
5. Klik "Kirim Formulir Pendaftaran"
6. Tim CAKRANA akan menghubungi via WhatsApp untuk jadwal survei
7. Teknisi datang survei lokasi → instalasi perangkat (1-3 hari kerja)
8. Setelah instalasi, pelanggan mendapat email aktivasi akun portal

## CARA MENGGUNAKAN PORTAL PELANGGAN
- Login: cakrana.co.id/login — bisa pakai password atau OTP ke email
- Dashboard: lihat status koneksi, paket aktif, kode pelanggan
- Tagihan: menu "Tagihan Saya" — lihat dan bayar tagihan bulanan
- Cara bayar: transfer bank → upload foto bukti bayar → tunggu verifikasi admin (maks 1x24 jam)
- Laporan gangguan: menu "Bantuan & Laporan" → buat tiket baru
- Ganti paket / pindah alamat / putus layanan: menu "Layanan" → ajukan permintaan

## INFORMASI TAGIHAN & PEMBAYARAN
- Tagihan terbit setiap tanggal 1 tiap bulan
- Jatuh tempo: 10 hari setelah tagihan terbit
- Metode pembayaran: Transfer Bank BCA (no. rek & nama cek di portal)
- Bukti bayar diupload di portal → verifikasi 1x24 jam hari kerja
- Keterlambatan bayar: dikenakan denda Rp 10.000/hari setelah jatuh tempo
- Jika belum bayar lebih dari jatuh tempo: layanan dinonaktifkan sementara

## KONTAK & SUPPORT CAKRANA
- Email: cs@cakrana.co.id
- WhatsApp: +62 812-3456-7890 (jam kerja: Senin–Sabtu, 08.00–17.00 WIB)
- Darurat gangguan: WhatsApp 24 jam (respons maks 2 jam)
- Tiket support di portal: respons maks 1x24 jam hari kerja

## ATURAN YANG WAJIB KAMU IKUTI
1. Jika pertanyaan DI LUAR layanan CAKRANA (misal: resep masakan, coding, berita politik, dll) → tolak dengan sopan dan arahkan ke topik CAKRANA
2. Jangan pernah mengkritik competitor atau menyebut brand lain secara negatif
3. Jangan memberikan informasi yang tidak kamu ketahui — lebih baik sarankan hubungi CS
4. Jawaban MAKSIMAL 3 paragraf pendek atau 5 poin bullet — jangan terlalu panjang
5. Selalu akhiri jawaban kompleks dengan menawarkan bantuan lebih lanjut
6. Jangan pernah mengaku sebagai manusia jika ditanya langsung
7. Jika ada pertanyaan teknis yang terlalu spesifik (misal konfigurasi router merk tertentu) → sarankan hubungi teknisi CAKRANA

## FORMAT JAWABAN
- Gunakan emoji secukupnya untuk membuat percakapan lebih ramah 😊
- Untuk list/daftar: gunakan bullet point yang rapi
- Untuk harga: selalu format Rupiah (Rp X.XXX.XXX)
- Jangan gunakan Markdown heading (###) dalam jawaban chat — gunakan **bold** untuk penekanan

Mulai sekarang, jawab semua pertanyaan berdasarkan panduan di atas.
`.trim()

// ── Type untuk history pesan ───────────────────────────────────
interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

// ── POST handler ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Validasi API key tersedia di environment
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[FAQ API] GEMINI_API_KEY tidak ditemukan di environment variables')
    return NextResponse.json(
      { error: 'Layanan AI sementara tidak tersedia. Silakan hubungi CS kami.' },
      { status: 503 }
    )
  }

  // 2. Parse request body
  let body: { question?: string; history?: ChatMessage[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const { question, history = [] } = body

  // 3. Validasi input question
  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'Pertanyaan tidak boleh kosong.' }, { status: 400 })
  }

  const trimmed = question.trim()
  if (trimmed.length === 0) {
    return NextResponse.json({ error: 'Pertanyaan tidak boleh kosong.' }, { status: 400 })
  }

  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `Pertanyaan terlalu panjang. Maksimal ${MAX_QUESTION_LENGTH} karakter.` },
      { status: 400 }
    )
  }

  // 4. Batasi history yang dikirim ke model (hemat token)
  const safeHistory: ChatMessage[] = Array.isArray(history)
    ? history.slice(-MAX_HISTORY_TURNS * 2).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(msg.parts?.[0]?.text ?? '') }],
      }))
    : []

  // 5. Inisialisasi Gemini
  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',        // gratis, cepat, cukup pintar
      systemInstruction: CAKRANA_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.4,               // lebih konsisten, tidak terlalu kreatif
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,          // cukup untuk jawaban FAQ
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    })

    // 6. Mulai chat session dengan history
    const chat = model.startChat({ history: safeHistory })

    // 7. Kirim pesan user
    const result = await chat.sendMessage(trimmed)
    const response = await result.response
    const text = response.text()

    if (!text) {
      return NextResponse.json(
        { error: 'AI tidak dapat memberikan jawaban saat ini. Silakan coba lagi.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ answer: text }, { status: 200 })

  } catch (error: any) {
    console.error('[FAQ API] Gemini error:', error?.message ?? error)

    // Handle rate limit
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Mohon tunggu sebentar lalu coba lagi.' },
        { status: 429 }
      )
    }

    // Handle API key invalid
    if (error?.status === 400 && error?.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Konfigurasi layanan AI bermasalah. Hubungi tim kami.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi atau hubungi CS kami.' },
      { status: 500 }
    )
  }
}