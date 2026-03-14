import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

  try {
    const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(url)}&palette=false&audio=false&video=false&iframe=false`;
    const res = await fetch(endpoint, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Homebook/1.0)' },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) return NextResponse.json({}, { status: 200 });

    const json = await res.json();
    const d = json.data ?? {};

    let hostname = '';
    try { hostname = new URL(url).hostname.replace('www.', ''); } catch {}

    return NextResponse.json({
      title:       d.title       ?? '',
      image:       d.image?.url  ?? d.logo?.url ?? '',
      description: d.description ?? '',
      publisher:   d.publisher   ?? hostname,
      price:       d.price?.amount ? String(d.price.amount) : '',
    });
  } catch (e) {
    return NextResponse.json({}, { status: 200 });
  }
}
