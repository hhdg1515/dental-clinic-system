import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '../AppShell';
import { useAuth } from '../../context/AuthContext';
import { UserDashboard } from '../../components/UserDashboard';

export const AppDashboardPage = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    return <Navigate to="/app/login" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/app/login', { replace: true });
  };

  return (
    <AppShell
      title="Member Portal"
      backHref="/"
      actions={
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          aria-label="Sign out"
        >
          <i className="fas fa-sign-out-alt text-sm" aria-hidden="true" />
        </button>
      }
    >
      <UserDashboard />
    </AppShell>
  );
};

export default AppDashboardPage;
