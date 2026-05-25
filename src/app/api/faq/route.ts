// src/app/api/faq/route.ts
// ─────────────────────────────────────────────────────────────
// CAKRANA AI FAQ — Powered by Groq (llama-3.3-70b-versatile)
// Daftar API key gratis di: console.groq.com
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'

const MAX_QUESTION_LENGTH = 500
const MAX_HISTORY_TURNS   = 10
const GROQ_MODEL          = 'llama-3.3-70b-versatile'
const GROQ_API_URL        = 'https://api.groq.com/openai/v1/chat/completions'

// ── System Prompt ──────────────────────────────────────────────
const CAKRANA_SYSTEM_PROMPT = `
Kamu adalah KANA, asisten FAQ cerdas milik CAKRANA — penyedia layanan internet rumahan (ISP) lokal yang beroperasi di wilayah Jawa Tengah, Indonesia.

## IDENTITAS KAMU
- Nama: KANA (CAKRANA Network Assistant)
- Bahasa: Indonesia yang sopan, ramah, dan mudah dipahami oleh semua kalangan
- Karakter: Helpful, jujur, ringkas — tidak bertele-tele
- Kamu BUKAN ChatGPT, Gemini, Groq, atau AI umum. Kamu adalah asisten khusus CAKRANA.

## RUANG LINGKUP PERTANYAAN YANG BOLEH DIJAWAB
Kamu HANYA boleh menjawab pertanyaan seputar:
1. Informasi paket internet CAKRANA (harga, kecepatan, fitur)
2. Cara mendaftar / registrasi layanan baru
3. Cara login dan menggunakan portal pelanggan
4. Tagihan, cara pembayaran, upload bukti bayar
5. Laporan gangguan / cara buat tiket support
6. Status akun, suspend, aktivasi
7. Kebijakan dan syarat layanan CAKRANA
8. Kontak dan jam operasional support
9. Pertanyaan umum tentang internet rumahan / WiFi

## DATA PAKET INTERNET CAKRANA
| Nama Paket    | Download | Upload  | Harga/Bulan | Keterangan                         |
|---------------|----------|---------|-------------|------------------------------------|
| Paket Basic   | 10 Mbps  | 5 Mbps  | Rp 100.000  | Cocok untuk 1-2 orang, browsing    |
| Paket Pro     | 20 Mbps  | 10 Mbps | Rp 150.000  | Terpopuler, WFH & streaming HD     |
| Paket Gaming  | 50 Mbps  | 25 Mbps | Rp 250.000  | Gaming, streaming 4K, banyak device|

Semua paket: TANPA FUP (kuota unlimited), garansi uptime 99%, free instalasi.

## CARA MENDAFTAR
1. Kunjungi website cakrana.co.id
2. Pilih paket lalu isi form pendaftaran (nama, email, WA, alamat lengkap)
3. Klik "Kirim Formulir Pendaftaran"
4. Tim CAKRANA hubungi via WhatsApp untuk jadwal survei lokasi
5. Teknisi survei dan instalasi (1-3 hari kerja)
6. Dapat email aktivasi akun portal pelanggan

## PORTAL PELANGGAN
- Login: cakrana.co.id/login — pakai password atau OTP email
- Tagihan: menu "Tagihan Saya"
- Cara bayar: transfer bank BCA → upload foto bukti → verifikasi admin maks 1x24 jam
- Laporan gangguan: menu "Bantuan & Laporan" → buat tiket baru
- Ganti paket / pindah alamat / putus layanan: menu "Layanan"

## INFO TAGIHAN
- Tagihan terbit setiap tanggal 1 tiap bulan
- Jatuh tempo: 10 hari setelah tagihan terbit
- Metode: Transfer Bank BCA (nomor rekening cek di portal)
- Telat bayar: denda Rp 10.000/hari setelah jatuh tempo
- Lewat jatuh tempo: layanan dinonaktifkan sementara

## KONTAK
- Email: cs@cakrana.co.id
- WhatsApp: +62 812-3456-7890 (Senin–Sabtu, 08.00–17.00 WIB)
- Darurat gangguan: WhatsApp 24 jam (respons maks 2 jam)
- Tiket support di portal: respons maks 1x24 jam hari kerja

## ATURAN PENTING
1. Pertanyaan DI LUAR layanan CAKRANA → tolak sopan dan arahkan ke topik CAKRANA
2. Jangan sebut atau bandingkan dengan kompetitor
3. Jawaban maksimal 3 paragraf pendek ATAU 5 poin bullet — jangan panjang
4. Jangan mengaku sebagai manusia jika ditanya langsung
5. Info tidak diketahui → sarankan hubungi CS

## FORMAT JAWABAN
- Pakai emoji secukupnya 😊
- Harga selalu format: Rp X.XXX.XXX
- Gunakan **bold** untuk penekanan, bukan heading ###
`.trim()

// ── Types ──────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ── Convert history ke format Groq (OpenAI-compatible) ────────
function buildGroqMessages(question: string, history: ChatMessage[]): GroqMessage[] {
  const messages: GroqMessage[] = [
    { role: 'system', content: CAKRANA_SYSTEM_PROMPT },
  ]

  for (const msg of history) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.parts?.[0]?.text ?? '',
    })
  }

  messages.push({ role: 'user', content: question })
  return messages
}

// ── POST handler ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Validasi API key
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error('[FAQ API] GROQ_API_KEY tidak ditemukan')
      return NextResponse.json(
        { error: 'Layanan AI sementara tidak tersedia. Silakan hubungi CS kami.' },
        { status: 503 },
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

    // 3. Validasi pertanyaan
    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Pertanyaan tidak boleh kosong.' }, { status: 400 })
    }

    const trimmed = question.trim()
    if (trimmed.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: `Pertanyaan terlalu panjang. Maksimal ${MAX_QUESTION_LENGTH} karakter.` },
        { status: 400 },
      )
    }

    // 4. Sanitasi & batasi history
    const safeHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .slice(-MAX_HISTORY_TURNS * 2)
          .map((msg) => ({
            role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
            parts: [{ text: String(msg.parts?.[0]?.text ?? '') }],
          }))
      : []

    // 5. Panggil Groq API (OpenAI-compatible endpoint)
    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: buildGroqMessages(trimmed, safeHistory),
        temperature: 0.4,
        max_tokens: 1024,
        top_p: 0.95,
      }),
    })

    if (!groqRes.ok) {
      const errBody = await groqRes.text().catch(() => '')
      console.error('[FAQ API] Groq error:', groqRes.status, errBody)

      if (groqRes.status === 429) {
        return NextResponse.json(
          { error: 'Terlalu banyak permintaan. Mohon tunggu sebentar lalu coba lagi.' },
          { status: 429 },
        )
      }
      if (groqRes.status === 401) {
        return NextResponse.json(
          { error: 'Konfigurasi layanan AI bermasalah. Hubungi tim kami.' },
          { status: 503 },
        )
      }

      return NextResponse.json(
        { error: 'Layanan AI sedang tidak tersedia. Silakan coba lagi.' },
        { status: 502 },
      )
    }

    // 6. Parse respons Groq
    const groqData = await groqRes.json()
    const text: string = groqData?.choices?.[0]?.message?.content ?? ''

    if (!text) {
      console.error('[FAQ API] Respons Groq kosong:', JSON.stringify(groqData))
      return NextResponse.json(
        { error: 'AI tidak dapat memberikan jawaban saat ini. Silakan coba lagi.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ answer: text }, { status: 200 })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[FAQ API] Unexpected error:', msg)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi atau hubungi CS kami.' },
      { status: 500 },
    )
  }
}