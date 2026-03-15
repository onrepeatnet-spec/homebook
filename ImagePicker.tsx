'use client';

/**
 * Scrollable grid of candidate images fetched from a URL.
 * User clicks one to select it.
 */
export default function ImagePicker({ images, selected, onSelect }: {
  images: string[];
  selected: string;
  onSelect: (url: string) => void;
}) {
  if (!images || images.length === 0) return null;

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
        Select an image
        <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 4 }}>({images.length} found)</span>
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6,
        maxHeight: 220,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '2px',
        borderRadius: 8,
        border: '1px solid var(--border)',
      }}>
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(url)}
            style={{
              all: 'unset',
              display: 'block',
              aspectRatio: '1',
              borderRadius: 6,
              overflow: 'hidden',
              cursor: 'pointer',
              border: `2px solid ${selected === url ? 'var(--accent)' : 'transparent'}`,
              boxShadow: selected === url ? '0 0 0 1px var(--accent)' : 'none',
              background: 'var(--bg)',
              transition: 'border-color 0.15s',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => {
                const el = e.currentTarget.parentElement;
                if (el) el.style.display = 'none';
              }}
            />
          </button>
        ))}
      </div>
      {selected && (
        <p style={{ fontSize: 11, color: 'var(--green)', marginTop: 6 }}>
          ✓ Image selected
        </p>
      )}
    </div>
  );
}
