import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  Settings,
  LogOut,
  Home,
  Bell,
  UserCircle,
  Upload,
  Download,
  Languages,
  Package,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useCRMSettings } from "@/hooks/useCRMSettings";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const crmSettings = useCRMSettings();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const { data } = await axiosClient.get("/users/current-user", {
          withCredentials: true,
        });

        setUser(data?.data?.user);
        setUserRole(data?.data?.user?.role);
        setLoading(false);
      } catch (err: any) {
        try {
          const { data } = await axiosClient.post(
            "/users/refresh-token",
            {},
            { withCredentials: true }
          );

          if (data?.success) {
            const { data: newUser } = await axiosClient.get(
              "/users/current-user",
              { withCredentials: true }
            );

            setUser(newUser?.data?.user);
            setUserRole(newUser?.data?.user?.role);
          } else {
            navigate("/auth");
          }
        } catch (refreshErr) {
          navigate("/auth");
        } finally {
          setLoading(false);
        }
      }
    };

    verifyAuth();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await axiosClient.post("/users/logout", {}, { withCredentials: true });

      toast({
        title: t("signOut"),
        description: t("signedOutDesc"),
      });

      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: t("dashboard"), path: "/" },
    { icon: Users, label: t("customers"), path: "/customers" },
    { icon: Mail, label: t("emails"), path: "/emails" },
    { icon: Package, label: t("products"), path: "/products" },
    { icon: FileText, label: t("reports"), path: "/reports" },
    { icon: Settings, label: t("settings"), path: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            {crmSettings?.crm_logo_url ? (
              <img
                src={crmSettings.crm_logo_url}
                alt={crmSettings.crm_name || "CRM"}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {crmSettings?.crm_name?.charAt(0) || "C"}
                </span>
              </div>
            )}
            <span className="text-sidebar-foreground font-bold text-lg">
              {crmSettings?.crm_name || "CRM"}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            {t("signOut")}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-sidebar flex items-center justify-end px-6">
          <div className="flex items-center gap-3">
            {userRole === "admin" && (
              <>
                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-xs font-semibold text-primary">
                    {t("admin")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sidebar-foreground"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t("import")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sidebar-foreground"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t("export")}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sidebar-foreground"
                    >
                      <Languages className="w-4 h-4 mr-2" />
                      {language === "en" ? t("english") : t("chinese")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLanguage("en")}>
                      {t("english")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage("zh")}>
                      {t("chinese")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground"
              onClick={() => navigate("/")}
              title={t("home")}
            >
              <Home className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-foreground"
                  title={t("notifications")}
                >
                  <Bell className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>{t("notifications")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-4 text-sm text-muted-foreground text-center">
                  {t("noNotifications")}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-foreground"
                  title={t("profile")}
                >
                  <UserCircle className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t("settings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
