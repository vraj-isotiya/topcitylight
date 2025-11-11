import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axiosClient from "@/lib/axiosClient";

// Define User and Context types
interface User {
  id: string;
  full_name: string;
  email: string;
  role: string; // e.g. "admin", "user", etc.
}

interface UserContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  userRole: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

// Provider Component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch logged-in user details from backend
  const refreshUser = async () => {
    try {
      const { data } = await axiosClient.get("/users/current-user");
      if (data?.data?.user) {
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axiosClient.post("/users/logout");
    } finally {
      setUser(null);
      window.location.href = "/auth";
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        userRole: user?.role || null,
        loading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Hook for easy access
export const useUser = () => useContext(UserContext);
