import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export default function Help() {
  return (
    <article className="container page-space help-page">
      <h1>Las buenas historias se comparten.</h1>
      <p className="lead">
        ReEstreno conecta a personas que tienen algo por ofrecer con quienes están buscando su
        próximo hallazgo.
      </p>
      <section>
        <h2>Encuentra. Conversa. Reestrena.</h2>
        <p>
          Explora el catálogo sin crear una cuenta. Usa las categorías, la ciudad y el precio para
          encontrar lo que buscas. Al iniciar sesión puedes guardar favoritos y coordinar por
          WhatsApp con el vendedor.
        </p>
      </section>
      <section>
        <h2>Lo tuyo puede ser el próximo estreno de alguien.</h2>
        <p>
          Crea tu cuenta, completa tu WhatsApp y publica un objeto con fotos propias, una
          descripción honesta y su precio. Gestiona tus publicaciones desde Mi espacio.
        </p>
      </section>
      <section>
        <h2>Una reseña después de una entrega.</h2>
        <p>
          Cuando concreten la compra, el vendedor confirma la entrega desde Compras y ventas. El
          comprador confirma que recibió el objeto y puede calificar al vendedor una sola vez. La
          confirmación es entre ambas partes; ReEstreno no verifica pagos.
        </p>
      </section>
      <section id="seguridad">
        <h2>Un buen trato empieza con cuidado.</h2>
        <p>
          Reúnete en un lugar público, revisa el objeto antes de pagar y no compartas códigos de
          verificación. Evita anticipos a desconocidos. No publiques tu dirección exacta ni datos
          bancarios.
        </p>
        <p>
          ReEstreno no cobra, transporta ni garantiza los objetos. Si encuentras una publicación
          sospechosa, usa Reportar publicación en su detalle.
        </p>
      </section>
      <Link className="button" href="/">
        Encontrar mi próximo estreno <ArrowUpRight size={18} />
      </Link>
    </article>
  );
}
