import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Sprout, Bug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";

type Profile = { full_name: string | null; farm_name: string | null; location: string | null };
type Fert = { id: string; crop: string; land_area: number; nitrogen: number; phosphorus: number; potassium: number; created_at: string };
type Disease = { id: string; crop: string | null; disease_name: string; confidence: number; created_at: string };

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({ full_name: "", farm_name: "", location: "" });
  const [ferts, setFerts] = useState<Fert[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: f }, { data: d }] = await Promise.all([
        supabase.from("profiles").select("full_name, farm_name, location").eq("user_id", user.id).maybeSingle(),
        supabase.from("fertilizer_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("disease_detections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (p) setProfile({ full_name: p.full_name ?? "", farm_name: p.farm_name ?? "", location: p.location ?? "" });
      setFerts(f ?? []); setDiseases(d ?? []);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, ...profile }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  return (
    <PageShell title="Profile" subtitle={user?.email ?? ""}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="glass border-0">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2"><Leaf className="w-5 h-5 text-primary" />Farm Details</h2>
            <div>
              <Label>Full Name</Label>
              <Input value={profile.full_name ?? ""} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <Label>Farm Name</Label>
              <Input value={profile.farm_name ?? ""} onChange={e => setProfile(p => ({ ...p, farm_name: e.target.value }))} />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={profile.location ?? ""} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} />
            </div>
            <Button onClick={save} disabled={saving} className="glow-btn text-primary-foreground w-full">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="glass border-0">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg flex items-center gap-2 mb-4"><Sprout className="w-5 h-5 text-primary" />Recent Fertilizer Calcs</h2>
              {ferts.length === 0 ? <p className="text-sm text-muted-foreground">No calculations yet.</p> : (
                <ul className="space-y-2">
                  {ferts.map((f, i) => (
                    <motion.li key={f.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                      <span className="capitalize font-medium">{f.crop} · {f.land_area} acre</span>
                      <span className="text-xs text-muted-foreground">N{f.nitrogen}·P{f.phosphorus}·K{f.potassium}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg flex items-center gap-2 mb-4"><Bug className="w-5 h-5 text-primary" />Recent Diagnoses</h2>
              {diseases.length === 0 ? <p className="text-sm text-muted-foreground">No diagnoses yet.</p> : (
                <ul className="space-y-2">
                  {diseases.map((d, i) => (
                    <motion.li key={d.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                      <span className="font-medium">{d.disease_name} <span className="text-muted-foreground">· {d.crop}</span></span>
                      <span className="text-xs text-primary font-semibold">{Math.round(d.confidence)}%</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
