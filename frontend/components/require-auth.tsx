'use client';
import Link from 'next/link';
import { ReactNode } from 'react';
import { useAuth } from './auth-provider';
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="empty">Preparando tu espacio…</div>;
  if (!user)
    return (
      <div className="empty">
        <h1>Tu próximo estreno empieza aquí</h1>
        <p>Ingresa para publicar, guardar favoritos y coordinar tus compras.</p>
        <Link href="/acceso" className="button">
          Ingresar o crear cuenta
        </Link>
      </div>
    );
  return children;
}
