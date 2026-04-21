import { motion } from "framer-motion";
import { Camera, ShoppingBag, Users, ShoppingCart, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  { label: "Diagnose", icon: Camera, color: "from-rose-400 to-pink-600", path: "/diagnose" },
  { label: "Marketplace", icon: ShoppingBag, color: "from-emerald-400 to-green-600", path: "/marketplace" },
  { label: "Community", icon: Users, color: "from-sky-400 to-blue-600", path: "/community" },
  { label: "Shops", icon: Store, color: "from-violet-400 to-purple-600", path: "/shops" },
  { label: "Cart", icon: ShoppingCart, color: "from-amber-400 to-orange-600", path: "/cart" },
];

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="grid grid-cols-2 md:grid-cols-5 gap-3"
    >
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <motion.button
            key={a.label}
            whileHover={{ y: -6, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(a.path)}
            className={`rounded-3xl p-5 bg-gradient-to-br ${a.color} text-white shadow-lg text-left group relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            <Icon className="w-7 h-7 mb-3" />
            <div className="font-semibold">{a.label}</div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
