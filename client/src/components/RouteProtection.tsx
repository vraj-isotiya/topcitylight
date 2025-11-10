import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axiosClient from "@/lib/axiosClient";

export const RouteProtection = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAccess();
  }, [location.pathname]);

  const checkAccess = async () => {
    try {
      setLoading(true);

      //  Verify session using backend
      const res = await axiosClient.get("/users/current-user");

      if (!res.data?.success || !res.data?.data?.user) {
        throw new Error("Unauthorized");
      }

      const user = res.data.data.user;

      //  Admin-only routes
      const adminOnlyRoutes = ["/settings"];
      const isAdmin = user.role === "admin";

      if (adminOnlyRoutes.includes(location.pathname) && !isAdmin) {
        setHasAccess(false);
        navigate("/");
        return;
      }

      //  Authenticated access granted
      setHasAccess(true);
    } catch (error: any) {
      console.warn("Unauthorized or session expired:", error);
      setHasAccess(false);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
