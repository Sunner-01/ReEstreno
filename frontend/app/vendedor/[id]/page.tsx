import { SellerProfile } from '../../../components/seller-profile';
export default async function Seller({ params }: { params: Promise<{ id: string }> }) {
  return <SellerProfile id={(await params).id} />;
}
