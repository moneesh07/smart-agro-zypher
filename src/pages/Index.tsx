import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Leaf, ArrowRight, Sprout, Mic, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen hero-bg relative overflow-hidden flex items-center">
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-glow/40 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/40 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
        >
          <Leaf className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Intelligent Agriculture Platform</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold mb-6 text-primary-foreground drop-shadow-lg"
        >
          Grow smarter with<br /><span className="bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">SmartAgro</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto"
        >
          AI-powered fertilizer calculator, crop recommendations, disease detection, and a voice assistant — all in one app.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3 justify-center mb-12"
        >
          <Button size="lg" onClick={() => navigate("/auth?mode=signup")} className="h-14 px-8 bg-white text-primary hover:bg-white/90 font-semibold text-base">
            Get started <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="h-14 px-8 bg-transparent border-white/60 text-white hover:bg-white/10 font-semibold text-base">
            Sign in
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {[
            { icon: Sprout, title: "Smart calculator", desc: "Precise N-P-K in seconds" },
            { icon: Mic, title: "Voice assistant", desc: "Just speak, SmartAgro listens" },
            { icon: Camera, title: "AI diagnosis", desc: "Detect diseases from a photo" },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="glass rounded-2xl p-5 text-left">
                <Icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
