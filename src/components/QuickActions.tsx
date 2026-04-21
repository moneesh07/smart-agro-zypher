import { motion } from "framer-motion";
import { Camera, ShoppingBag, Users, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const actions = [
  { label: "Diagnose Disease", icon: Camera, color: "from-rose-400 to-pink-600" },
  { label: "Marketplace", icon: ShoppingBag, color: "from-emerald-400 to-green-600" },
  { label: "Community", icon: Users, color: "from-sky-400 to-blue-600" },
  { label: "Cart", icon: ShoppingCart, color: "from-amber-400 to-orange-600" },
];

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
    >
      {actions.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.button
            key={a.label}
            whileHover={{ y: -6, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => toast.info(`${a.label} coming in Phase 2`)}
            className={`rounded-3xl p-5 bg-gradient-to-br ${a.color} text-white shadow-lg text-left group relative overflow-hidden`}
            style={{ animationDelay: `${i * 80}ms` }}
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
