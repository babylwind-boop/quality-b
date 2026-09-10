import { NextRequest, NextResponse } from 'next/server';

/**
 * Lead webhook. Every form on the site posts here — LeadForm (contact page,
 * home CTA, global lead modal), HausKonfigurator and PartnerWizard — and the
 * submission is fanned out to two channels:
 *
 *   1. Telegram — bot message to the office chat.
 *   2. E-mail  — relayed to Netlify Forms (POST /__forms.html, see
 *      public/__forms.html); Netlify stores the submission and e-mails the
 *      recipients configured under Forms → Form notifications.
 *
 * The request succeeds when at least one channel delivered; a failing channel
 * is logged so it shows up in the Netlify function logs.
 *
 * Env vars (see .env.example):
 *   TELEGRAM_BOT_TOKEN   — bot token from @BotFather
 *   TELEGRAM_CHAT_ID     — target chat/channel id
 *   NETLIFY_FORMS_ORIGIN — optional absolute origin of the deployed site used
 *                          for the Netlify Forms relay; falls back to the
 *                          DEPLOY_PRIME_URL / URL variables Netlify injects.
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

/** Plain-text variant of TYPE_HEADERS for the e-mail subject / body. */
const TYPE_TITLES: Record<LeadType, string> = {
  consultation: 'Neue Beratungsanfrage',
  contact: 'Neue Kontaktanfrage',
  callback: 'Neue Rückrufanfrage',
  visit: 'Neuer Vor-Ort-Termin',
  partner: 'Neue GU-Partneranfrage',
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

/**
 * Netlify Forms field name per payload key — these are the labels the
 * notification e-mail shows. Must match the inputs in public/__forms.html.
 * "email" has to keep that exact name: Netlify uses it as the Reply-To.
 */
const NETLIFY_FORM_NAME = 'lead';
const MAIL_FIELDS: Record<string, string> = {
  company: 'Firma',
  name: 'Name',
  phone: 'Telefon',
  email: 'email',
  service: 'Leistung',
  preferredDate: 'Wunschtermin',
  trades: 'Gewerke',
  objectType: 'Objektart',
  volume: 'Volumen',
  start: 'Start',
  location: 'Standort',
  message: 'Nachricht',
  context: 'Kontext',
};

/** Escape user input for Telegram HTML parse mode. */
function esc(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** Trimmed, length-capped copy of the submitted fields (empty ones dropped). */
function cleanFields(formData: LeadPayload['formData']): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(formData)) {
    const value = raw == null ? '' : String(raw).trim();
    if (value) out[key] = value.slice(0, 500);
  }
  return out;
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

/* ------------------------------------------------------------------------ */
/* Channel 1: Telegram                                                       */
/* ------------------------------------------------------------------------ */

function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

async function sendTelegram(body: LeadPayload, fields: Record<string, string>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured');

  const lines: string[] = [`<b>${TYPE_HEADERS[body.formType]}</b>`, ''];
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const value = fields[key];
    if (value) lines.push(`${label}: ${esc(value)}`);
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
      link_preview_options: { is_disabled: true },
    }),
  });
  if (!res.ok) {
    throw new Error(`Telegram API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

/* ------------------------------------------------------------------------ */
/* Channel 2: e-mail via Netlify Forms                                       */
/* ------------------------------------------------------------------------ */

/** Origin of the deployed site that receives the Netlify Forms POST. */
function formsOrigin(): string | undefined {
  const raw =
    process.env.NETLIFY_FORMS_ORIGIN || process.env.DEPLOY_PRIME_URL || process.env.URL;
  return raw ? raw.replace(/\/$/, '') : undefined;
}

function mailConfigured(): boolean {
  return Boolean(formsOrigin());
}

async function sendMail(body: LeadPayload, fields: Record<string, string>) {
  const origin = formsOrigin();
  if (!origin) throw new Error('NETLIFY_FORMS_ORIGIN / DEPLOY_PRIME_URL / URL not configured');

  const who = fields.name || fields.company || fields.phone || fields.email || '';
  const title = TYPE_TITLES[body.formType];
  const params = new URLSearchParams();
  params.set('form-name', NETLIFY_FORM_NAME);
  params.set('subject', who ? `${title} – ${who}` : title);
  params.set('Anfrage', title);
  for (const [key, label] of Object.entries(MAIL_FIELDS)) {
    const value = fields[key];
    if (value) params.set(label, value);
  }
  if (body.locale) params.set('Sprache', body.locale);
  if (body.page) params.set('Seite', body.page.slice(0, 200));

  const res = await fetch(`${origin}/__forms.html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(
      `Netlify Forms ${res.status} at ${origin}: ${(await res.text()).slice(0, 200)}`,
    );
  }
}

/* ------------------------------------------------------------------------ */

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

  const fields = cleanFields(formData);
  if (!fields.name && !fields.phone && !fields.email) {
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

  const channels: { name: string; run: () => Promise<void> }[] = [];
  if (telegramConfigured()) {
    channels.push({ name: 'telegram', run: () => sendTelegram(body, fields) });
  } else {
    console.error('[lead] telegram skipped: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured');
  }
  if (mailConfigured()) {
    channels.push({ name: 'mail', run: () => sendMail(body, fields) });
  } else {
    console.error('[lead] mail skipped: no Netlify Forms origin configured');
  }

  if (channels.length === 0) {
    return NextResponse.json(
      { error: 'Notification service not configured' },
      { status: 500 },
    );
  }

  const results = await Promise.allSettled(channels.map((c) => c.run()));
  const delivered: string[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      delivered.push(channels[i].name);
    } else {
      const reason =
        result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`[lead] ${channels[i].name} failed: ${reason}`);
    }
  });

  if (delivered.length === 0) {
    return NextResponse.json(
      { error: 'Failed to deliver notification' },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, delivered });
}
