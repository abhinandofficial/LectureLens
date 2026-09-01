import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  // TEMPORARY (Day 4-6 will make this real): no login exists yet,
  // so we allow access regardless of auth state for now.
  const { isAuthenticated } = useAuth();
  const bypassAuthForNow = true;

  if (!isAuthenticated && !bypassAuthForNow) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;