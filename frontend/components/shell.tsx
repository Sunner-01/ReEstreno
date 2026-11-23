'use client';
import Link from 'next/link';
import { Repeat2, Plus, Heart, ArrowUpRight, UserRound, LogOut } from 'lucide-react';
import { useAuth } from './auth-provider';
export function Header() {
  const { user, signOut } = useAuth();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="ReEstreno, inicio">
          <span className="brand-mark">
            <Repeat2 size={24} />
          </span>
          Re<span>Estreno</span>
          <i>.</i>
        </Link>
        <nav aria-label="Navegación principal">
          <Link href="/#catalogo" className="explore-link">
            Explorar
          </Link>
          <Link href="/favoritos" className="icon-link" aria-label="Favoritos">
            <Heart size={20} />
          </Link>
          {user ? (
            <>
              <Link href="/cuenta" className="account-link">
                <UserRound size={19} />
                <span>Mi espacio</span>
              </Link>
              <button onClick={signOut} className="icon-link logout" aria-label="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link href="/acceso" className="account-link">
              Ingresar
            </Link>
          )}
          <Link href="/publicar" className="button small" aria-label="Vender un objeto">
            <Plus size={18} />
            <span>Vender un objeto</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer container">
      <div>
        <Link href="/" className="brand">
          ReEstreno<i>.</i>
        </Link>
        <p>
          Menos cosas guardadas.
          <br />
          Más historias por estrenar.
        </p>
      </div>
      <div>
        <Link href="/ayuda">
          Cómo funciona <ArrowUpRight size={15} />
        </Link>
        <Link href="/ayuda#seguridad">Compra con cuidado</Link>
        <span>Hecho para dar otra vuelta.</span>
      </div>
    </footer>
  );
}
