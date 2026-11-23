import { RequireAuth } from '../../components/require-auth';
import { ListingEditor } from '../../components/listing-editor';
export default function Publish() {
  return (
    <div className="container page-space">
      <h1>Dale su próximo comienzo.</h1>
      <p className="lead">Publica eso que ya no usas. Su nueva historia puede empezar hoy.</p>
      <RequireAuth>
        <ListingEditor />
      </RequireAuth>
    </div>
  );
}
