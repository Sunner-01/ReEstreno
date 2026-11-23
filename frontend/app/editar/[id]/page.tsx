import { RequireAuth } from '../../../components/require-auth';
import { ListingEditor } from '../../../components/listing-editor';
export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="container page-space">
      <h1>Actualiza tu publicación</h1>
      <RequireAuth>
        <ListingEditor id={id} />
      </RequireAuth>
    </div>
  );
}
