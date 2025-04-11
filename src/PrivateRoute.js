import { Navigate } from "react-router-dom";
import { auth } from "./firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";

export default function PrivateRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div className="text-center mt-10">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}