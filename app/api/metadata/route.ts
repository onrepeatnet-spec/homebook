import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

  try {
    // Try microlink first
    const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(url)}&palette=false&audio=false&video=false&iframe=false&screenshot=false`;
    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    });

    let microlinkImages: string[] = [];
    let title = '';
    let description = '';
    let publisher = '';
    let price = '';
    let primaryImage = '';

    if (res.ok) {
      const json = await res.json();
      const d = json.data ?? {};
      title       = d.title       ?? '';
      description = d.description ?? '';
      publisher   = d.publisher   ?? '';
      price       = d.price?.amount ? String(d.price.amount) : '';
      primaryImage = d.image?.url ?? '';

      // Collect all available images from microlink
      if (d.image?.url)       microlinkImages.push(d.image.url);
      if (d.logo?.url)        microlinkImages.push(d.logo.url);
    }

    // Always also try to scrape Open Graph tags directly for more images
    // This catches Portuguese/EU sites that microlink doesn't fully support
    const ogImages = await scrapeOGImages(url);

    // Merge: og images first (more reliable), then microlink images
    const allImages = [...new Set([...ogImages, ...microlinkImages])].filter(Boolean);
    if (!primaryImage && allImages.length > 0) primaryImage = allImages[0];

    // Fallback publisher from hostname
    if (!publisher) {
      try { publisher = new URL(url).hostname.replace('www.', ''); } catch {}
    }

    return NextResponse.json({
      title,
      image: primaryImage,
      images: allImages.slice(0, 8), // up to 8 images to choose from
      description,
      publisher,
      price,
    });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}

async function scrapeOGImages(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const html = await res.text();

    // Extract all og:image and twitter:image tags
    const images: string[] = [];
    const ogImageRegex = /<meta[^>]+(?:property=["']og:image["']|name=["']twitter:image["'])[^>]+content=["']([^"']+)["']/gi;
    const ogImageRegex2 = /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property=["']og:image["']|name=["']twitter:image["'])/gi;

    let match;
    while ((match = ogImageRegex.exec(html)) !== null) images.push(match[1]);
    while ((match = ogImageRegex2.exec(html)) !== null) images.push(match[1]);

    // Also try to find product images (common patterns on e-commerce sites)
    const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        const extractImages = (obj: any): void => {
          if (!obj) return;
          if (typeof obj === 'string' && (obj.startsWith('http') && (obj.includes('.jpg') || obj.includes('.png') || obj.includes('.webp')))) {
            images.push(obj);
          }
          if (Array.isArray(obj)) obj.forEach(extractImages);
          if (typeof obj === 'object') {
            if (obj.image) extractImages(obj.image);
            if (obj.thumbnail) extractImages(obj.thumbnail);
            if (obj.thumbnailUrl) extractImages(obj.thumbnailUrl);
          }
        };
        extractImages(data);
      } catch { /* ignore malformed JSON-LD */ }
    }

    return [...new Set(images)].filter(url => url.startsWith('http')).slice(0, 8);
  } catch {
    return [];
  }
}
