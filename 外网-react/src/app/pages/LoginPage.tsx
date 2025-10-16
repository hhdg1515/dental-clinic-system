import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '../AppShell';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from '../../components/LoginForm';

export const AppLoginPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (currentUser) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <AppShell title="Member Access" backHref="/">
      <LoginForm onSuccess={() => navigate('/app/dashboard')} />
    </AppShell>
  );
};

export default AppLoginPage;
