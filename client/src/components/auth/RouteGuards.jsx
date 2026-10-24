import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { PageLoader } from "../ui/Feedback.jsx";
import { EmptyState } from "../ui/Feedback.jsx";
import { Button } from "../ui/Button.jsx";
import { ShieldAlert } from "lucide-react";

// These guards only shape the UI. Every protected API route checks the
// session and role on the server, so bypassing them in the browser gets
// nothing but 401/403 responses.
export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) {
    return (
      <div className="container">
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Admins only"
          action={
            <Button to="/" variant="dark">
              Back to the store
            </Button>
          }
        >
          You're signed in as {user.email}, which doesn't have access to the dashboard.
        </EmptyState>
      </div>
    );
  }
  return <Outlet />;
}
