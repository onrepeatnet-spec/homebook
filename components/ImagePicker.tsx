'use client';

/**
 * Shows a scrollable grid of candidate images fetched from a URL.
 * The user clicks one to select it as the main image.
 */
export default function ImagePicker({ images, selected, onSelect }: {
  images: string[];
  selected: string;
  onSelect: (url: string) => void;
}) {
  if (images.length === 0) return null;

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
        Pick an image <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({images.length} found)</span>
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: 8,
        maxHeight: 240,
        overflowY: 'auto',
        padding: 4,
      }}>
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => onSelect(url)}
            style={{
              padding: 0,
              border: `2px solid ${selected === url ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 8,
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'var(--bg)',
              outline: selected === url ? '2px solid var(--accent-light)' : 'none',
              transition: 'border-color 0.15s',
              aspectRatio: '1',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
