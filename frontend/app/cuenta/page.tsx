import { RequireAuth } from '../../components/require-auth';
import { Account } from '../../components/account';
export default function AccountPage() {
  return (
    <div className="container page-space">
      <RequireAuth>
        <Account />
      </RequireAuth>
    </div>
  );
}
