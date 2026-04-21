import { motion } from "framer-motion";
import { Leaf, LogOut, ShoppingCart, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationBell from "@/components/NotificationBell";

export default function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [cartCount, setCartCount] = useState(0);
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || t("header.defaultName");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id);
      setCartCount((data ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0));
    };
    load();
    const ch = supabase
      .channel("cart-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-8"
    >
      <Link to="/dashboard" className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl glow-btn flex items-center justify-center">
          <Leaf className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("header.welcome")}</p>
          <h1 className="font-bold text-lg">{name} 🌾</h1>
        </div>
      </Link>
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <NotificationBell />
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} aria-label={t("header.admin")}>
            <Shield className="w-5 h-5 text-primary" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => navigate("/cart")} aria-label={t("header.cart")} className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} aria-label={t("header.profile")}>
          <User className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" /> {t("common.signOut")}
        </Button>
      </div>
    </motion.header>
  );
}
