import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="empty">
      <h1>Esta historia no está aquí.</h1>
      <p>La página que buscas no existe o cambió de lugar.</p>
      <Link href="/" className="button">
        Volver a explorar
      </Link>
    </div>
  );
}
