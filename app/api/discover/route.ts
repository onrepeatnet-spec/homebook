import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { type, city } = await req.json(); // type: 'markets' | 'stores'

  const today = new Date();
  const monthName = today.toLocaleString('en-GB', { month: 'long' });
  const year = today.getFullYear();

  const prompt = type === 'markets'
    ? `Search for upcoming antique, vintage, and flea markets, fairs, and bazaars in Portugal in ${monthName} ${year} and the next 2 months. Include events in ${city || 'Lisbon, Porto, and other cities'}.

For each event return a JSON array with objects like:
{
  "title": "Feira da Ladra",
  "date": "YYYY-MM-DD",
  "city": "Lisboa",
  "location": "Campo de Santa Clara",
  "type": "Flea Market",
  "notes": "One-line description",
  "url": "https://..." or null,
  "recurring": true or false,
  "recurring_desc": "Every Tuesday and Saturday" or null
}

Return ONLY the JSON array, no other text. Include up to 15 results. If a recurring market doesn't have a specific next date, use the next occurrence. Today is ${today.toISOString().slice(0, 10)}.`

    : `Search for the best antique shops, vintage stores, second-hand furniture shops, and brocantes in Portugal. Focus on well-established stores in Lisbon, Porto, and other cities.

For each store return a JSON array with objects like:
{
  "name": "A Vida Portuguesa",
  "city": "Lisboa",
  "neighbourhood": "Chiado",
  "address": "Rua Anchieta 11, Lisboa",
  "type": "Vintage & Antiques",
  "description": "One or two sentence description of what they sell and why it's worth visiting",
  "url": "https://..." or null,
  "instagram": "@handle" or null,
  "price_range": "€" or "€€" or "€€€"
}

Return ONLY the JSON array, no other text. Include 15-20 of the best results.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    // Extract text from all content blocks (web search returns mixed blocks)
    const text = (data.content ?? [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    // Parse JSON — strip any markdown fences
    const clean = text.replace(/```json|```/g, '').trim();
    // Find JSON array in the response
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json({ error: 'No results found', raw: text }, { status: 200 });
    }
    const results = JSON.parse(match[0]);
    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
