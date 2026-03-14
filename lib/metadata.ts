export type PageMeta = {
  title: string;
  image: string;
  images: string[];  // multiple images to choose from
  description: string;
  publisher: string;
  price: string;
};

export async function fetchMetadata(url: string): Promise<Partial<PageMeta>> {
  try {
    const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}
