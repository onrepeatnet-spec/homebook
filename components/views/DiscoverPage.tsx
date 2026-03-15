'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import type { CalendarEvent } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type MarketResult = {
  title: string;
  date: string;
  city: string;
  location: string;
  type: string;
  notes: string;
  url: string | null;
  recurring: boolean;
  recurring_desc: string | null;
};

type StoreResult = {
  name: string;
  city: string;
  neighbourhood: string;
  address: string;
  type: string;
  description: string;
  url: string | null;
  instagram: string | null;
  price_range: string;
};

const CITIES = ['All Portugal', 'Lisboa', 'Porto', 'Braga', 'Coimbra', 'Setúbal', 'Faro', 'Évora'];

const MARKET_COLORS: Record<string, string> = {
  'Flea Market':    '#C17B4E',
  'Antique Fair':   '#6B7FA8',
  'Vintage Market': '#8B6BAE',
  'Brocante':       '#4A7C6F',
  'Craft Fair':     '#D4A843',
  'Other':          '#B87065',
};

function colorFor(type: string) {
  return MARKET_COLORS[type] ?? '#C17B4E';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DiscoverPage({ onAddEvent }: {
  onAddEvent: (e: Omit<CalendarEvent, 'id' | 'created_at'>) => Promise<void>;
}) {
  const [tab, setTab] = useState<'markets' | 'stores'>('markets');
  const [city, setCity] = useState('All Portugal');
  const [loading, setLoading] = useState(false);
  const [markets, setMarkets] = useState<MarketResult[]>([]);
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [error, setError] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingEvent, setAddingEvent] = useState<MarketResult | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: tab, city: city === 'All Portugal' ? null : city }),
      });
      const data = await res.json();
      if (data.error && !data.results) {
        setError(data.error);
      } else if (tab === 'markets') {
        // Sort by date
        const sorted = (data.results ?? []).sort((a: MarketResult, b: MarketResult) =>
          (a.date ?? '').localeCompare(b.date ?? '')
        );
        setMarkets(sorted);
      } else {
        setStores(data.results ?? []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = async (market: MarketResult, date: string, notes: string) => {
    setSavingEvent(true);
    try {
      await onAddEvent({
        title: market.title,
        date,
        time: null,
        type: 'Other',
        notes: [market.location, market.city, notes].filter(Boolean).join(' · '),
        linked_todo_id: null,
      });
      setAddedIds(prev => new Set([...prev, market.title + date]));
      setAddingEvent(null);
    } finally {
      setSavingEvent(false);
    }
  };

  const filteredMarkets = markets.filter(m =>
    city === 'All Portugal' || m.city?.toLowerCase().includes(city.toLowerCase())
  );
  const filteredStores = stores.filter(s =>
    city === 'All Portugal' || s.city?.toLowerCase().includes(city.toLowerCase())
  );

  return (
    <div style={{ padding: '28px 36px' }} className="animate-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>Discover</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>
          Find antique &amp; vintage markets, fairs, and stores in Portugal
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <button className={`tab-btn ${tab === 'markets' ? 'active' : ''}`}
          onClick={() => { setTab('markets'); setSearched(false); }}>
          🗓 Upcoming Markets & Fairs
        </button>
        <button className={`tab-btn ${tab === 'stores' ? 'active' : ''}`}
          onClick={() => { setTab('stores'); setSearched(false); }}>
          🏪 Antique & Vintage Stores
        </button>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CITIES.map(c => (
            <button key={c} onClick={() => setCity(c)}
              style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: city === c ? 'var(--accent)' : 'var(--surface)', color: city === c ? 'white' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)' }}>
              {c}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={search} disabled={loading}
          style={{ marginLeft: 'auto' }}>
          {loading
            ? <><Icon name="loader" size={14} /> Searching…</>
            : <><Icon name="sparkles" size={14} /> {searched ? 'Refresh' : 'Search with AI'}</>}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🔍</div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 6 }}>
            Searching the web…
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
            {tab === 'markets'
              ? 'Finding upcoming fairs and markets in Portugal'
              : 'Discovering the best antique and vintage stores'}
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ background: '#FEF2F0', border: '1px solid #FBCDC7', borderRadius: 10, padding: '16px 20px', color: 'var(--red)', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Empty state before search */}
      {!loading && !searched && !error && (
        <div className="card" style={{ padding: '60px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>{tab === 'markets' ? '🏺' : '🛍️'}</div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 300, marginBottom: 8 }}>
            {tab === 'markets' ? 'Find upcoming markets & fairs' : 'Discover antique stores'}
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            {tab === 'markets'
              ? 'Uses AI + web search to find antique fairs, flea markets, and vintage bazaars happening in Portugal soon.'
              : 'Uses AI + web search to find the best antique shops, brocantes, and vintage stores across Portugal.'}
          </p>
          <button className="btn btn-primary" onClick={search}>
            <Icon name="sparkles" size={14} /> Search with AI
          </button>
        </div>
      )}

      {/* Markets results */}
      {!loading && tab === 'markets' && filteredMarkets.length > 0 && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
            {filteredMarkets.length} event{filteredMarkets.length !== 1 ? 's' : ''} found · click any to add to your calendar
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredMarkets.map((market, i) => {
              const id = market.title + market.date;
              const added = addedIds.has(id);
              const color = colorFor(market.type);
              const dateStr = market.date
                ? new Date(market.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                : null;
              return (
                <div key={i} className="card" style={{ padding: '16px 20px', borderLeft: `3px solid ${color}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{market.title}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: color + '20', color, fontWeight: 500 }}>
                        {market.type}
                      </span>
                      {market.recurring && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 500 }}>
                          🔄 Recurring
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-3)', marginBottom: market.notes ? 6 : 0 }}>
                      {dateStr && <span>📅 {dateStr}</span>}
                      {market.recurring_desc && <span>🔄 {market.recurring_desc}</span>}
                      <span>📍 {market.location}, {market.city}</span>
                    </div>
                    {market.notes && <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.5 }}>{market.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    {market.url && (
                      <a href={market.url} target="_blank" rel="noreferrer"
                        className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }}>
                        <Icon name="link" size={12} />
                      </a>
                    )}
                    <button
                      className="btn btn-ghost"
                      disabled={added}
                      style={added ? { color: 'var(--green)', borderColor: 'var(--green)', fontSize: 12 } : { fontSize: 12 }}
                      onClick={() => setAddingEvent(market)}>
                      {added ? '✓ Added' : '+ Calendar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 20, lineHeight: 1.6 }}>
            ⚠️ AI-generated results — always verify dates and locations before visiting. Markets may change or be cancelled.
          </p>
        </div>
      )}

      {/* Stores results */}
      {!loading && tab === 'stores' && filteredStores.length > 0 && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
            {filteredStores.length} store{filteredStores.length !== 1 ? 's' : ''} found
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filteredStores.map((store, i) => (
              <div key={i} className="card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{store.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {store.neighbourhood ? `${store.neighbourhood}, ` : ''}{store.city}
                    </p>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>{store.price_range}</span>
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 500, display: 'inline-block', marginBottom: 8 }}>
                  {store.type}
                </span>
                <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10 }}>{store.description}</p>
                {store.address && (
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>📍 {store.address}</p>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {store.url && (
                    <a href={store.url} target="_blank" rel="noreferrer"
                      className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none' }}>
                      <Icon name="link" size={11} /> Website
                    </a>
                  )}
                  {store.instagram && (
                    <a href={`https://instagram.com/${store.instagram.replace('@','')}`} target="_blank" rel="noreferrer"
                      className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none' }}>
                      📸 {store.instagram}
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(store.name + ' ' + store.address)}`}
                    target="_blank" rel="noreferrer"
                    className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none' }}>
                    🗺 Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 20, lineHeight: 1.6 }}>
            ⚠️ AI-generated results — verify opening hours and addresses before visiting.
          </p>
        </div>
      )}

      {/* No results after search */}
      {!loading && searched && !error && tab === 'markets' && filteredMarkets.length === 0 && markets.length > 0 && (
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No markets found in {city} — try "All Portugal".</p>
      )}
      {!loading && searched && !error && tab === 'stores' && filteredStores.length === 0 && stores.length > 0 && (
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No stores found in {city} — try "All Portugal".</p>
      )}

      {/* Add to calendar modal */}
      {addingEvent && (
        <Modal title="Add to Calendar" onClose={() => setAddingEvent(null)}>
          <AddToCalendarForm
            market={addingEvent}
            saving={savingEvent}
            onSave={addToCalendar}
            onCancel={() => setAddingEvent(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// ─── Add to Calendar sub-form ─────────────────────────────────────────────────

function AddToCalendarForm({ market, saving, onSave, onCancel }: {
  market: MarketResult;
  saving: boolean;
  onSave: (market: MarketResult, date: string, notes: string) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(market.date ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(market.notes ?? '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', borderLeft: '3px solid var(--accent)' }}>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{market.title}</p>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>📍 {market.location}, {market.city}</p>
        {market.recurring && market.recurring_desc && (
          <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>🔄 {market.recurring_desc}</p>
        )}
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Date *</label>
        <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        {market.recurring && (
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            This is a recurring market — pick the specific date you want to visit.
          </p>
        )}
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Notes</label>
        <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 70 }} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={!date || saving} onClick={() => onSave(market, date, notes)}>
          {saving ? 'Adding…' : 'Add to Calendar'}
        </button>
      </div>
    </div>
  );
}
