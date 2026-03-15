import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

async function callClaude(messages: any[], attempt = 0): Promise<{ text: string; debug: any[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in environment variables');

  const response = await fetch(ANTHROPIC_API, {
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

  const data = await response.json();
  const debugEntry = {
    attempt,
    status: response.status,
    stop_reason: data.stop_reason,
    content_types: (data.content ?? []).map((b: any) => b.type),
    error: data.error ?? null,
  };

  if (!response.ok) {
    throw new Error(data?.error?.message ?? `API error ${response.status}: ${JSON.stringify(data)}`);
  }

  // Web search: Claude returns tool_use blocks, Anthropic executes the search
  // and returns tool_result blocks in the SAME response content array.
  // We pass the full assistant content back, then the tool_results from that same response.
  if (data.stop_reason === 'tool_use' && attempt < 6) {
    // Find tool_result blocks already in this response (Anthropic auto-executes web search)
    const toolResultBlocks = (data.content ?? []).filter((b: any) => b.type === 'tool_result');
    
    // If Anthropic already included tool results, just continue with full content
    // Otherwise build synthetic tool results
    const toolUseBlocks = (data.content ?? []).filter((b: any) => b.type === 'tool_use');
    
    const userContent = toolResultBlocks.length > 0
      ? toolResultBlocks
      : toolUseBlocks.map((b: any) => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: 'Search executed.',
        }));

    const nextMessages = [
      ...messages,
      { role: 'assistant', content: data.content },
      { role: 'user', content: userContent },
    ];

    const { text, debug } = await callClaude(nextMessages, attempt + 1);
    return { text, debug: [debugEntry, ...debug] };
  }

  const text = (data.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('');

  return { text, debug: [debugEntry] };
}

export async function POST(req: NextRequest) {
  const { type, city } = await req.json();

  const today = new Date();
  const monthName = today.toLocaleString('en-GB', { month: 'long' });
  const year = today.getFullYear();

  const prompt = type === 'markets'
    ? `Search the web for upcoming antique, vintage, and flea markets, fairs, and bazaars in Portugal in ${monthName} ${year} and the coming months. Include events in ${city || 'Lisbon, Porto, and other cities'}.

After searching, return ONLY a raw JSON array with no markdown formatting, no code blocks, no explanation. Just the array starting with [ and ending with ].

Each object must have these exact fields:
{"title":"Feira da Ladra","date":"${year}-MM-DD","city":"Lisboa","location":"Campo de Santa Clara","type":"Flea Market","notes":"One sentence description","url":null,"recurring":true,"recurring_desc":"Every Tuesday and Saturday"}

Today is ${today.toISOString().slice(0, 10)}. Include up to 15 results.`

    : `Search the web for the best antique shops, vintage stores, brocantes, and second-hand furniture shops in Portugal, in Lisbon, Porto, and other cities.

After searching, return ONLY a raw JSON array with no markdown formatting, no code blocks, no explanation. Just the array starting with [ and ending with ].

Each object must have these exact fields:
{"name":"Store Name","city":"Lisboa","neighbourhood":"Chiado","address":"Rua Example 10, Lisboa","type":"Antiques","description":"Two sentences about what they sell.","url":null,"instagram":null,"price_range":"€€"}

Include 15-20 results.`;

  try {
    const { text, debug } = await callClaude([{ role: 'user', content: prompt }]);

    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const match = clean.match(/\[[\s\S]*\]/);

    if (!match) {
      return NextResponse.json({
        error: 'AI did not return structured results.',
        raw: clean.slice(0, 500),
        debug,
      });
    }

    try {
      const results = JSON.parse(match[0]);
      return NextResponse.json({ results, debug });
    } catch {
      return NextResponse.json({
        error: 'Failed to parse AI response as JSON.',
        raw: match[0].slice(0, 500),
        debug,
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
