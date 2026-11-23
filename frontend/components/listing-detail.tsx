'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  MapPin,
  ShieldCheck,
  Heart,
  Flag,
  Star,
  MessageCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { Listing, Review, money, statusLabel } from '../lib/types';
import { useAuth } from './auth-provider';
import { Avatar } from './avatar';
export function ListingDetail({ id }: { id: string }) {
  const [item, setItem] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [photo, setPhoto] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(false);
  const [link, setLink] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    api<Listing>(`/listings/${id}`)
      .then((x) => {
        setItem(x);
        return api<Review[]>(`/profiles/${x.seller_id}/reviews`);
      })
      .then(setReviews)
      .catch((e) => setError(e.message));
  }, [id]);
  async function contact() {
    if (!user) return router.push('/acceso');
    setBusy(true);
    setError('');
    try {
      const result = await api<{ url: string }>(`/listings/${id}/contact`, { method: 'POST' });
      setLink(result.url);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!user) return router.push('/acceso');
    try {
      await api(`/favorites/${id}`, { method: 'POST' });
      setNotice('Guardado en tus favoritos.');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (!item)
    return (
      <div className="empty">
        <h2>{error || 'Buscando tu próximo estreno…'}</h2>
        <Link href="/">Volver al catálogo</Link>
      </div>
    );
  const owner = user?.id === item.seller_id;
  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  return (
    <div className="container page-space">
      <Link href="/#catalogo" className="back-link">
        <ArrowLeft size={17} />
        Volver a explorar
      </Link>
      <div className="detail-layout">
        <div>
          <div className="detail-photo">
            <img src={item.images[photo]} alt={item.title} />
            <span className="condition-tag">{item.condition}</span>
          </div>
          {item.images.length > 1 && (
            <div className="thumbnails">
              {item.images.map((src, i) => (
                <button
                  className={photo === i ? 'selected' : ''}
                  key={src}
                  onClick={() => setPhoto(i)}
                  aria-label={`Ver foto ${i + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
          <section className="description">
            <h2>Una historia que continúa</h2>
            <p>{item.description}</p>
            <div className="detail-specs">
              <span>
                Categoría<strong>{item.category}</strong>
              </span>
              <span>
                Estado<strong>{item.condition}</strong>
              </span>
              <span>
                Ubicación<strong>{item.city}</strong>
              </span>
            </div>
          </section>
        </div>
        <aside className="detail-summary">
          <div className="product-meta">
            <span>{item.category}</span>
            <span>
              <MapPin size={14} />
              {item.city}
            </span>
          </div>
          <h1>{item.title}</h1>
          <div className="detail-price">{money(item.price)}</div>
          <span className={`status ${item.status}`}>{statusLabel[item.status]}</span>
          <div className="seller-row">
            <Avatar name={item.seller?.name || 'Vendedor'} url={item.seller?.avatar_url} />
            <div>
              <Link href={`/vendedor/${item.seller_id}`}>
                <strong>
                  {item.seller?.name || 'Vendedor'} <ArrowUpRight size={14} />
                </strong>
              </Link>
              <span>
                {average ? (
                  <>
                    <Star size={13} fill="currentColor" />
                    {average} · {reviews.length} reseñas
                  </>
                ) : (
                  'Aún sin calificaciones'
                )}
              </span>
            </div>
          </div>
          {owner ? (
            <Link className="button full" href={`/editar/${id}`}>
              Editar mi publicación
            </Link>
          ) : (
            <>
              <button
                disabled={busy || item.status !== 'available'}
                className="button full"
                onClick={contact}
              >
                <MessageCircle size={20} />
                {busy ? 'Preparando contacto…' : 'Coordinar por WhatsApp'}
                <ArrowUpRight size={18} />
              </button>
              <button className="button secondary full" onClick={save}>
                <Heart size={18} />
                Guardar en favoritos
              </button>
            </>
          )}
          {link && (
            <p className="notice">
              Contacto listo.{' '}
              <a href={link} target="_blank" rel="noopener noreferrer">
                Abrir WhatsApp
              </a>
            </p>
          )}
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="safety-note">
            <ShieldCheck size={23} />
            <p>
              Conversa, revisa y decide.
              <br />
              <span>
                Reúnete en un lugar público y revisa el objeto antes de pagar. ReEstreno no procesa
                pagos.
              </span>
            </p>
          </div>
          <p className="fineprint">
            Publicado el {new Date(item.created_at).toLocaleDateString('es-BO')}
          </p>
          <button
            className="text-link muted"
            onClick={() => (user ? setReport(!report) : router.push('/acceso'))}
          >
            <Flag size={15} />
            Reportar publicación
          </button>
          {report && (
            <form
              className="form-stack report-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const reason = new FormData(e.currentTarget).get('reason');
                try {
                  await api(`/listings/${id}/report`, {
                    method: 'POST',
                    body: JSON.stringify({ reason }),
                  });
                  setReport(false);
                  setNotice('Reporte recibido. Gracias por ayudarnos a cuidar la comunidad.');
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <label>
                Motivo del reporte
                <textarea name="reason" minLength={10} maxLength={500} required />
              </label>
              <button className="button small">Enviar reporte</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
