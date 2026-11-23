'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { RequireAuth } from '../../components/require-auth';
type Report = {
  id: string;
  listing_id: string;
  reason: string;
  listing: { title: string; hidden: boolean };
};
export default function Moderation() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState('');
  function load() {
    api<Report[]>('/moderation')
      .then(setReports)
      .catch((e) => setError(e.message));
  }
  useEffect(load, []);
  return (
    <div className="container page-space">
      <h1>Cuidar la comunidad</h1>
      <RequireAuth>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {reports.map((r) => (
          <article className="review" key={r.id}>
            <h2>{r.listing.title}</h2>
            <p>{r.reason}</p>
            {r.listing.hidden ? (
              <span>Publicación oculta</span>
            ) : (
              <button
                className="button small"
                onClick={async () => {
                  try {
                    await api(`/moderation/${r.listing_id}/hide`, { method: 'POST' });
                    load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Ocultar publicación
              </button>
            )}
          </article>
        ))}
        {!error && !reports.length && <p className="empty">No hay reportes pendientes.</p>}
      </RequireAuth>
    </div>
  );
}
