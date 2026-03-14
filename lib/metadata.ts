export type PageMeta = {
  title: string;
  image: string;
  description: string;
  publisher: string;
  price: string;
};

/**
 * Fetch page metadata via our own API route (avoids CORS issues with microlink.io).
 */
export async function fetchMetadata(url: string): Promise<Partial<PageMeta>> {
  try {
    const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}
