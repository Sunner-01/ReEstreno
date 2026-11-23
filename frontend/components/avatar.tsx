'use client';
import { useEffect, useState } from 'react';

export function Avatar({ name, url, large = false }: { name: string; url?: string | null; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return (
    <span className={`avatar${large ? ' large' : ''}`} aria-label={`Foto de ${name}`}>
      {url && !failed ? (
        <img src={url} alt="" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{name.trim().charAt(0).toUpperCase() || 'R'}</span>
      )}
    </span>
  );
}
