import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { Leaf, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const authSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
  fullName: z.string().trim().min(2, "Name required").max(80).optional(),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "signup" ? "signup" : "login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });

  useEffect(() => { if (user) navigate("/dashboard", { replace: true }); }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = authSchema.safeParse(mode === "signup" ? form : { email: form.email, password: form.password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: form.fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created! Welcome to SmartAgro 🌱");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden hero-bg">
      {/* floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-glow/40 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary/40 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative z-10 w-full max-w-md rounded-3xl p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl glow-btn flex items-center justify-center">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SmartAgro</h1>
            <p className="text-xs text-muted-foreground">Intelligent Agriculture</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-2">{mode === "login" ? "Welcome back" : "Start growing smarter"}</h2>
        <p className="text-muted-foreground mb-6">
          {mode === "login" ? "Sign in to your farm dashboard" : "Create your SmartAgro account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative mt-1">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="fullName" className="pl-10" value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} maxLength={80} />
              </div>
            </motion.div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" className="pl-10" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} required />
            </div>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="password" type="password" className="pl-10" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} maxLength={72} required />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 glow-btn text-primary-foreground font-semibold border-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary font-semibold hover:underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
