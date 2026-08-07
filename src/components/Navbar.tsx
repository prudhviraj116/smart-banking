import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/transfer", label: "Transfer" },
    { path: "/transactions", label: "Transactions" },
    { path: "/profile", label: "Profile" },
    { path: "/settings", label: "Settings" },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="group flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-banking-gradient shadow-card transition-transform group-hover:-translate-y-0.5">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Smart<span className="text-gradient-primary">Bank</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 rounded-2xl border border-border bg-secondary/50 p-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                  location.pathname === item.path
                    ? "bg-primary/15 text-primary-glow shadow-inner"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 md:flex">
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 border-t border-border px-1 pb-4 pt-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block rounded-xl px-3 py-2 text-base font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-primary/15 text-primary-glow"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Button variant="outline" size="sm" onClick={handleLogout} className="mt-4 w-full gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
