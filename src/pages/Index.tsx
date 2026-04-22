import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Leaf, ArrowRight, Sprout, Mic, Camera, ShoppingBag, Cloud, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = "SmartAgro — AI Farming Assistant for Modern Farmers";
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute("content", "SmartAgro: AI fertilizer calculator, crop recommendations, plant disease detection, voice assistant, marketplace, and weather — all in one farming super app.");

    let ld = document.getElementById("ld-json") as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "ld-json";
      document.head.appendChild(ld);
    }
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "SmartAgro",
      applicationCategory: "AgricultureApplication",
      operatingSystem: "Web",
      description: "AI-powered farming assistant with fertilizer calculator, disease detection, voice assistant, marketplace, and weather.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "1240" },
    });
  }, []);

  const features = [
    { icon: Sprout, title: "Smart Calculator", desc: "Precise N-P-K dosages tailored to your crop and soil." },
    { icon: Camera, title: "AI Diagnosis", desc: "Snap a leaf, get the disease and treatment in seconds." },
    { icon: Mic, title: "Voice Assistant", desc: "Hands-free guidance in your regional language." },
    { icon: Cloud, title: "Live Weather", desc: "Hyperlocal forecasts and actionable rain alerts." },
    { icon: ShoppingBag, title: "Marketplace", desc: "Buy seeds, fertilizers, and tools from trusted sellers." },
    { icon: Users, title: "Community", desc: "Learn from experts and share with fellow farmers." },
  ];

  const testimonials = [
    { name: "Ramesh P.", role: "Wheat farmer, Punjab", text: "Cut my fertilizer bill by 22% using SmartAgro's calculator." },
    { name: "Sunita K.", role: "Tomato grower, Maharashtra", text: "Detected blight early and saved my entire crop. Lifesaver." },
    { name: "Anil M.", role: "Cotton farmer, Telangana", text: "The voice assistant in Telugu made it so easy to use." },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden hero-bg">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-glow/40 blur-3xl animate-float" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/40 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        </div>

        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Leaf className="w-6 h-6" />
            <span className="font-bold text-lg">SmartAgro</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="outline" className="bg-transparent border-white/60 text-white hover:bg-white/10">
            Sign in
          </Button>
        </nav>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-24 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Intelligent Agriculture Platform</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-primary-foreground drop-shadow-lg">
            Grow smarter with<br />
            <span className="bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">SmartAgro</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            AI fertilizer calculator, crop recommendations, disease detection, voice assistant, marketplace, and live weather — built for the modern farmer.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" onClick={() => navigate("/auth?mode=signup")} className="h-14 px-8 bg-white text-primary hover:bg-white/90 font-semibold text-base">
              Get started free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="h-14 px-8 bg-transparent border-white/60 text-white hover:bg-white/10 font-semibold text-base">
              Sign in
            </Button>
          </motion.div>

          <div className="mt-10 flex items-center justify-center gap-2 text-white/90 text-sm">
            <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-300 text-yellow-300" />)}</div>
            <span className="font-medium">4.8</span>
            <span className="text-white/70">· trusted by 1,200+ farmers</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything you need on one farm</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Six AI-powered tools that replace a dozen apps and save you hours every week.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.article key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/40 transition">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Loved by farmers across India</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.blockquote key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-card rounded-2xl p-6 border border-border/50">
                <div className="flex mb-3">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-primary text-primary" />)}</div>
                <p className="text-sm leading-relaxed mb-4">"{t.text}"</p>
                <footer>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="rounded-3xl hero-bg p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to grow smarter?</h2>
            <p className="text-white/90 mb-8 max-w-xl mx-auto">Join thousands of farmers already using SmartAgro to boost yields and cut costs.</p>
            <Button size="lg" onClick={() => navigate("/auth?mode=signup")} className="h-14 px-10 bg-white text-primary hover:bg-white/90 font-semibold text-base">
              Start free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">SmartAgro</span>
        </div>
        © {new Date().getFullYear()} SmartAgro · Built for farmers, powered by AI.
      </footer>
    </main>
  );
}
