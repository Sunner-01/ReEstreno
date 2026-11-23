'use client';
import Link from 'next/link';
import { Heart, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Listing, money, statusLabel } from '../lib/types';
import { api } from '../lib/api';
import { useAuth } from './auth-provider';
export function ListingCard({
  item,
  saved = false,
  onSaved,
}: {
  item: Listing;
  saved?: boolean;
  onSaved?: () => void;
}) {
  const [favorite, setFavorite] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  async function toggle() {
    if (!user) return router.push('/acceso');
    setBusy(true);
    try {
      await api(`/favorites/${item.id}`, { method: favorite ? 'DELETE' : 'POST' });
      setFavorite(!favorite);
      onSaved?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="product-card">
      <div className="product-image">
        <Link href={`/objeto/${item.id}`}>
          <img src={item.images[0]} alt={item.title} loading="lazy" />
        </Link>
        <span className="condition-tag">
          {item.status !== 'available' ? statusLabel[item.status] : item.condition}
        </span>
        <button
          className={`save-button ${favorite ? 'saved' : ''}`}
          aria-label={`${favorite ? 'Quitar de' : 'Guardar en'} favoritos: ${item.title}`}
          aria-pressed={favorite}
          disabled={busy}
          onClick={toggle}
        >
          <Heart size={19} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-info">
        <div className="product-meta">
          <span>{item.category}</span>
          <span>
            <MapPin size={12} />
            {item.city}
          </span>
        </div>
        <Link href={`/objeto/${item.id}`}>
          <h3>{item.title}</h3>
        </Link>
        <strong className="price">{money(item.price)}</strong>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
