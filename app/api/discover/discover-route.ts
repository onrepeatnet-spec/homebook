import { NextRequest, NextResponse } from 'next/server';

const API = 'https://api.anthropic.com/v1/messages';

async function post(messages: any[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  return data;
}

export async function POST(req: NextRequest) {
  const { type, city } = await req.json();
  const today = new Date();
  const month = today.toLocaleString('en-GB', { month: 'long' });
  const year  = today.getFullYear();
  const dateStr = today.toISOString().slice(0, 10);

  const prompt = type === 'markets'
    ? `Search the web for upcoming antique, vintage, and flea markets in Portugal in ${month} ${year}. Include ${city || 'Lisbon, Porto, and other Portuguese cities'}.

Return ONLY a JSON array. No explanation, no markdown, no code blocks. Start your response with [ and end with ].

Example format:
[{"title":"Feira da Ladra","date":"${year}-04-15","city":"Lisboa","location":"Campo de Santa Clara","type":"Flea Market","notes":"Famous flea market","url":null,"recurring":true,"recurring_desc":"Every Tuesday and Saturday"},{"title":"Mercado de Antiguidades","date":"${year}-04-20","city":"Porto","location":"Praça de Carlos Alberto","type":"Antique Fair","notes":"Monthly antique market","url":null,"recurring":true,"recurring_desc":"First Sunday of the month"}]`

    : `Search the web for antique shops, vintage stores, and brocantes in Portugal, especially in Lisbon and Porto.

Return ONLY a JSON array. No explanation, no markdown, no code blocks. Start your response with [ and end with ].

Example format:
[{"name":"Feira da Ladra Shop","city":"Lisboa","neighbourhood":"Alfama","address":"Rua das Flores 10","type":"Antiques","description":"Curated antiques and vintage furniture.","url":null,"instagram":null,"price_range":"€€"},{"name":"Porto Vintage","city":"Porto","neighbourhood":"Bonfim","address":"Rua do Bonfim 5","type":"Vintage","description":"Vintage clothing and homeware.","url":null,"instagram":"@portovintage","price_range":"€"}]`;

  const debug: any[] = [];

  try {
    // Step 1 — initial request
    let data = await post([{ role: 'user', content: prompt }]);
    debug.push({ step: 1, stop_reason: data.stop_reason, types: data.content.map((b: any) => b.type) });

    // Step 2 — agentic loop: keep going while stop_reason is tool_use
    let loops = 0;
    let messages: any[] = [{ role: 'user', content: prompt }];

    while (data.stop_reason === 'tool_use' && loops < 6) {
      loops++;
      messages = [
        ...messages,
        { role: 'assistant', content: data.content },
      ];

      // Build tool_result for every tool_use block
      const toolResults = data.content
        .filter((b: any) => b.type === 'tool_use')
        .map((b: any) => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: b.content ?? b.output ?? '',
        }));

      if (toolResults.length === 0) break;
      messages.push({ role: 'user', content: toolResults });

      data = await post(messages);
      debug.push({ step: loops + 1, stop_reason: data.stop_reason, types: data.content.map((b: any) => b.type) });
    }

    // Extract all text
    const text = data.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    debug.push({ final_text_length: text.length, preview: text.slice(0, 300) });

    if (!text) {
      return NextResponse.json({ error: 'AI returned no text content', debug });
    }

    // Try to extract JSON array
    const stripped = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const match = stripped.match(/\[[\s\S]*\]/);

    if (!match) {
      return NextResponse.json({ error: 'AI did not return a JSON array', raw: text.slice(0, 600), debug });
    }

    const results = JSON.parse(match[0]);
    return NextResponse.json({ results, debug });

  } catch (e: any) {
    return NextResponse.json({ error: e.message, debug }, { status: 500 });
  }
}
