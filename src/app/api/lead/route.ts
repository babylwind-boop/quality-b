import { NextRequest, NextResponse } from 'next/server';

/**
 * Lead webhook: receives form submissions and forwards them to Telegram.
 *
 * Env vars required (see .env.example):
 *   TELEGRAM_BOT_TOKEN — bot token from @BotFather
 *   TELEGRAM_CHAT_ID   — target chat/channel id
 */

type LeadType = 'consultation' | 'contact' | 'callback' | 'visit' | 'partner';

interface LeadPayload {
  formType: LeadType;
  formData: Record<string, string | undefined>;
  /** Honeypot — must stay empty; bots fill it. */
  website?: string;
  locale?: string;
  page?: string;
}

const TYPE_HEADERS: Record<LeadType, string> = {
  consultation: '🏗 Neue Beratungsanfrage',
  contact: '📞 Neue Kontaktanfrage',
  callback: '📲 Neue Rückrufanfrage',
  visit: '📅 Neuer Vor-Ort-Termin',
  partner: '🤝 Neue GU-Partneranfrage',
};

const FIELD_LABELS: Record<string, string> = {
  company: '🏢 Firma',
  name: '👤 Name',
  email: '📧 E-Mail',
  phone: '📱 Telefon',
  trades: '🧱 Gewerke',
  objectType: '🏠 Objektart',
  volume: '💶 Volumen',
  start: '🗓 Start',
  location: '📍 Standort',
  message: '💬 Nachricht',
  service: '🔨 Leistung',
  preferredDate: '📆 Wunschtermin',
  context: '🏷 Kontext',
};

/** Escape user input for Telegram HTML parse mode. */
function esc(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/* Naive per-instance rate limiter: 5 submissions / minute / IP. */
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const list = (hits.get(ip) ?? []).filter((t) => t > windowStart);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 2000) hits.clear();
  return list.length > 5;
}

export async function POST(request: NextRequest) {
  let body: LeadPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot: pretend success so bots stop retrying.
  if (body.website) {
    return NextResponse.json({ success: true });
  }

  const { formType, formData } = body;
  if (!formType || !formData || typeof formData !== 'object') {
    return NextResponse.json({ error: 'Form data is required' }, { status: 400 });
  }
  if (!(formType in TYPE_HEADERS)) {
    return NextResponse.json({ error: 'Unknown form type' }, { status: 400 });
  }

  const name = (formData.name ?? '').trim();
  const phone = (formData.phone ?? '').trim();
  const email = (formData.email ?? '').trim();
  if (!name && !phone && !email) {
    return NextResponse.json(
      { error: 'At least one contact field is required' },
      { status: 400 },
    );
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('[lead] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured');
    return NextResponse.json(
      { error: 'Notification service not configured' },
      { status: 500 },
    );
  }

  const lines: string[] = [`<b>${TYPE_HEADERS[formType]}</b>`, ''];
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const value = formData[key];
    if (value && String(value).trim()) {
      lines.push(`${label}: ${esc(String(value).trim().slice(0, 500))}`);
    }
  }
  const meta: string[] = [];
  if (body.locale) meta.push(`🌐 ${esc(body.locale)}`);
  if (body.page) meta.push(`🔗 ${esc(body.page.slice(0, 200))}`);
  if (meta.length) {
    lines.push('', '─'.repeat(24), '', meta.join('\n'));
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`[lead] Telegram API ${res.status}: ${detail}`);
    return NextResponse.json(
      { error: 'Failed to deliver notification' },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
