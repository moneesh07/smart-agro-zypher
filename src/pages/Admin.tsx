import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Plus, Trash2, Pencil, Loader2, Package, UserCog, Store } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

type TableName = "marketplace_items" | "experts" | "shops";

const schemas = {
  marketplace_items: z.object({
    name: z.string().min(1).max(120),
    category: z.string().min(1).max(60),
    price: z.coerce.number().min(0),
    unit: z.string().min(1).max(20),
    stock: z.coerce.number().int().min(0),
    description: z.string().max(500).optional().or(z.literal("")),
    image_url: z.string().url().max(500).optional().or(z.literal("")),
    seller: z.string().max(120).optional().or(z.literal("")),
    phone: z.string().max(40).optional().or(z.literal("")),
  }),
  experts: z.object({
    name: z.string().min(1).max(120),
    specialization: z.string().min(1).max(120),
    experience_years: z.coerce.number().int().min(0).max(80),
    rating: z.coerce.number().min(0).max(5),
    location: z.string().max(120).optional().or(z.literal("")),
    phone: z.string().max(40).optional().or(z.literal("")),
    avatar_url: z.string().url().max(500).optional().or(z.literal("")),
  }),
  shops: z.object({
    name: z.string().min(1).max(120),
    address: z.string().min(1).max(240),
    distance_km: z.coerce.number().min(0),
    phone: z.string().max(40).optional().or(z.literal("")),
    latitude: z.coerce.number().optional().or(z.nan()),
    longitude: z.coerce.number().optional().or(z.nan()),
  }),
};

const fieldDefs: Record<TableName, { key: string; label: string; type?: string; textarea?: boolean }[]> = {
  marketplace_items: [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price", type: "number" },
    { key: "unit", label: "Unit" },
    { key: "stock", label: "Stock", type: "number" },
    { key: "seller", label: "Seller" },
    { key: "phone", label: "Phone" },
    { key: "image_url", label: "Image URL" },
    { key: "description", label: "Description", textarea: true },
  ],
  experts: [
    { key: "name", label: "Name" },
    { key: "specialization", label: "Specialization" },
    { key: "experience_years", label: "Experience (yrs)", type: "number" },
    { key: "rating", label: "Rating (0-5)", type: "number" },
    { key: "location", label: "Location" },
    { key: "phone", label: "Phone" },
    { key: "avatar_url", label: "Avatar URL" },
  ],
  shops: [
    { key: "name", label: "Shop Name" },
    { key: "address", label: "Address" },
    { key: "distance_km", label: "Distance (km)", type: "number" },
    { key: "phone", label: "Phone" },
    { key: "latitude", label: "Latitude", type: "number" },
    { key: "longitude", label: "Longitude", type: "number" },
  ],
};

const tabMeta: { id: TableName; label: string; icon: any }[] = [
  { id: "marketplace_items", label: "Marketplace", icon: Package },
  { id: "experts", label: "Experts", icon: UserCog },
  { id: "shops", label: "Shops", icon: Store },
];

function CrudTable({ table }: { table: TableName }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [table]);

  const openNew = () => {
    setEditing(null);
    setForm({});
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    const f: Record<string, string> = {};
    fieldDefs[table].forEach((d) => { f[d.key] = row[d.key] ?? ""; });
    setForm(f);
    setOpen(true);
  };

  const save = async () => {
    const cleaned: any = {};
    for (const d of fieldDefs[table]) {
      const v = form[d.key];
      if (v === "" || v === undefined || v === null) continue;
      cleaned[d.key] = v;
    }
    const parsed = (schemas[table] as any).safeParse(cleaned);
    if (!parsed.success) {
      toast.error("Please check fields: " + Object.keys(parsed.error.flatten().fieldErrors).join(", "));
      return;
    }
    const payload: any = {};
    Object.entries(parsed.data).forEach(([k, v]) => {
      if (v === "" || (typeof v === "number" && isNaN(v as number))) return;
      payload[k] = v;
    });
    setSaving(true);
    const res = editing
      ? await supabase.from(table).update(payload).eq("id", editing.id)
      : await supabase.from(table).insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Updated" : "Created");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{rows.length} {rows.length === 1 ? "item" : "items"}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} size="sm">
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Create"} {tabMeta.find((t) => t.id === table)?.label.replace(/s$/, "")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {fieldDefs[table].map((d) => (
                <div key={d.key} className="space-y-1">
                  <Label htmlFor={d.key}>{d.label}</Label>
                  {d.textarea ? (
                    <Textarea id={d.key} value={form[d.key] ?? ""} onChange={(e) => setForm({ ...form, [d.key]: e.target.value })} />
                  ) : (
                    <Input id={d.key} type={d.type ?? "text"} value={form[d.key] ?? ""} onChange={(e) => setForm({ ...form, [d.key]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No items yet. Click "New" to add one.</div>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {table === "marketplace_items" && `${r.category} · ₹${r.price}/${r.unit} · stock ${r.stock}`}
                  {table === "experts" && `${r.specialization} · ${r.experience_years}y · ★${r.rating}`}
                  {table === "shops" && `${r.address} · ${r.distance_km}km`}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { isAdmin, loading } = useUserRole();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Checking permissions…</div>;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <PageShell
      title="Admin Panel"
      subtitle="Manage marketplace, experts and shops"
      action={<Badge variant="secondary" className="gap-1"><Shield className="w-3 h-3" /> Admin</Badge>}
    >
      <Tabs defaultValue="marketplace_items" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          {tabMeta.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {tabMeta.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            <CrudTable table={t.id} />
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  );
}
