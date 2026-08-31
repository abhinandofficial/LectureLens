import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // TODO (Day 4-6): replace this with real auth state from AuthContext
  const isAuthenticated = true; // temporarily always true so routing can be tested today

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;