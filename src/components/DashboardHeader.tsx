import { motion } from "framer-motion";
import { Leaf, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardHeader() {
  const { user, signOut } = useAuth();
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Farmer";

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-8"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl glow-btn flex items-center justify-center">
          <Leaf className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Welcome back</p>
          <h1 className="font-bold text-lg">{name} 🌾</h1>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={signOut}>
        <LogOut className="w-4 h-4 mr-2" /> Sign out
      </Button>
    </motion.header>
  );
}
