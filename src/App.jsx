import { AuthProvider, useAuth } from './hooks/useAuth';
import AppRoutes from './Routes';

const AppContent = () => {
  const { user } = useAuth();
  const userRole = user?.role

  return (
    <>
      <AppRoutes userRole={userRole} />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
