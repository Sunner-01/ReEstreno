'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/auth-provider';
import { RequireAuth } from '../../components/require-auth';
import { ListingCard } from '../../components/listing-card';
import { api } from '../../lib/api';
import { Listing } from '../../lib/types';
export default function Favorites() {
  const { user } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  function load() {
    api<{ listing: Listing | null }[]>('/me/favorites')
      .then((x) => setItems(x.flatMap((x) => (x.listing ? [x.listing] : []))))
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true));
  }
  useEffect(() => {
    if (user) load();
  }, [user]);
  return (
    <div className="container page-space">
      <h1>De esos que no quieres perder.</h1>
      <p className="lead">Tus favoritos, juntos en un mismo lugar.</p>
      <RequireAuth>
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : !loaded ? (
          <p>Cargando tus favoritos…</p>
        ) : items.length ? (
          <div className="product-grid">
            {items.map((item) => (
              <ListingCard key={item.id} item={item} saved onSaved={load} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>Aquí van tus próximos hallazgos</h2>
            <p>Guarda los objetos que te gustan tocando el corazón.</p>
            <Link href="/" className="button">
              Explorar objetos
            </Link>
          </div>
        )}
      </RequireAuth>
    </div>
  );
}
