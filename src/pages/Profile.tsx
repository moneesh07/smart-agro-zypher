import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Sprout, Bug, Camera, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";

type Profile = { full_name: string | null; farm_name: string | null; location: string | null; avatar_url: string | null };
type Fert = { id: string; crop: string; land_area: number; nitrogen: number; phosphorus: number; potassium: number; created_at: string };
type Disease = { id: string; crop: string | null; disease_name: string; confidence: number; created_at: string };

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({ full_name: "", farm_name: "", location: "", avatar_url: "" });
  const [ferts, setFerts] = useState<Fert[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    document.title = "Profile · SmartAgro";
    (async () => {
      const [{ data: p }, { data: f }, { data: d }] = await Promise.all([
        supabase.from("profiles").select("full_name, farm_name, location, avatar_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("fertilizer_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("disease_detections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (p) setProfile({ full_name: p.full_name ?? "", farm_name: p.farm_name ?? "", location: p.location ?? "", avatar_url: p.avatar_url ?? "" });
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

  const onPickFile = () => fileRef.current?.click();

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Max 3MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: dbErr } = await supabase.from("profiles").upsert({ user_id: user.id, avatar_url: url }, { onConflict: "user_id" });
    setUploading(false);
    if (dbErr) toast.error(dbErr.message);
    else { setProfile(p => ({ ...p, avatar_url: url })); toast.success("Avatar updated"); }
  };

  const initials = (profile.full_name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <PageShell title="Profile" subtitle={user?.email ?? ""}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="glass border-0">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 ring-2 ring-primary/30">
                  <AvatarImage src={profile.avatar_url ?? undefined} alt="Avatar" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{initials}</AvatarFallback>
                </Avatar>
                <button
                  onClick={onPickFile}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition disabled:opacity-50"
                  aria-label="Upload avatar"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
              </div>
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2"><Leaf className="w-5 h-5 text-primary" />Farm Details</h2>
                <p className="text-xs text-muted-foreground">PNG/JPG · max 3MB</p>
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <div className="text-2xl font-bold text-primary">{ferts.length}</div>
                <div className="text-xs text-muted-foreground">Calculations</div>
              </div>
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <div className="text-2xl font-bold text-primary">{diseases.length}</div>
                <div className="text-xs text-muted-foreground">Diagnoses</div>
              </div>
            </div>
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
