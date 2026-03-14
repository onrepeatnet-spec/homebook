/**
 * Fetch page metadata (title, image, description) from a URL
 * using the free microlink.io API.
 */
export type PageMeta = {
  title: string;
  image: string;
  description: string;
  publisher: string;
  price: string;
};

export async function fetchMetadata(url: string): Promise<Partial<PageMeta>> {
  try {
    const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(url)}&palette=false&audio=false&video=false&iframe=false`;
    const res = await fetch(endpoint);
    if (!res.ok) return {};
    const json = await res.json();
    const d = json.data ?? {};
    return {
      title:       d.title       ?? '',
      image:       d.image?.url  ?? d.logo?.url ?? '',
      description: d.description ?? '',
      publisher:   d.publisher   ?? new URL(url).hostname.replace('www.', ''),
      price:       d.price?.amount ? String(d.price.amount) : '',
    };
  } catch {
    return {};
  }
}
