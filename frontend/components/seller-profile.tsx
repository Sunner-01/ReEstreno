'use client';
import { useEffect, useState } from 'react';
import { MapPin, Star } from 'lucide-react';
import { api } from '../lib/api';
import { Profile, Listing, Review } from '../lib/types';
import { ListingCard } from './listing-card';
import { Avatar } from './avatar';
export function SellerProfile({ id }: { id: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([
      api<Profile>(`/profiles/${id}`),
      api<Listing[]>(`/listings?seller=${id}`),
      api<Review[]>(`/profiles/${id}/reviews`),
    ])
      .then(([p, l, r]) => {
        setProfile(p);
        setItems(l);
        setReviews(r);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  if (!profile) return <div className="empty">{error || 'Cargando perfil…'}</div>;
  return (
    <div className="container page-space">
      <section className="profile-heading">
        <Avatar name={profile.name} url={profile.avatar_url} large />
        <div>
          <h1>{profile.name}</h1>
          <p>
            <MapPin size={16} />
            {profile.city} · En ReEstreno desde{' '}
            {new Date(profile.created_at).toLocaleDateString('es-BO', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p>{profile.bio}</p>
        </div>
      </section>
      <h2>Objetos con otra historia por vivir</h2>
      <div className="product-grid">
        {items.map((x) => (
          <ListingCard item={x} key={x.id} />
        ))}
      </div>
      {!items.length && <p className="empty">Todavía no tiene publicaciones.</p>}
      <section className="reviews-section">
        <h2>Lo que cuentan sus compradores</h2>
        <p>Reseñas de entregas confirmadas por ambas partes; no verificamos pagos.</p>
        {reviews.length ? (
          reviews.map((r) => (
            <article className="review" key={r.id}>
              <strong>{r.buyer.name}</strong>
              <span className="stars" aria-label={`${r.rating} de 5 estrellas`}>
                {Array.from({ length: r.rating }, (_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </span>
              <p>{r.comment}</p>
              <small>{new Date(r.created_at).toLocaleDateString('es-BO')}</small>
            </article>
          ))
        ) : (
          <div className="empty">Todavía no hay reseñas. Cada buena experiencia cuenta.</div>
        )}
      </section>
    </div>
  );
}
