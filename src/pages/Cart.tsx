import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/PageShell";

type Row = {
  id: string; quantity: number;
  marketplace_items: { id: string; name: string; price: number; unit: string; image_url: string | null; phone: string | null } | null;
};

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("cart_items")
      .select("id, quantity, marketplace_items(id, name, price, unit, image_url, phone)")
      .eq("user_id", user.id);
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const update = async (id: string, qty: number) => {
    if (qty <= 0) return remove(id);
    await supabase.from("cart_items").update({ quantity: qty }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    load();
  };

  const total = rows.reduce((s, r) => s + (r.marketplace_items?.price ?? 0) * r.quantity, 0);

  return (
    <PageShell title="Your Cart" subtitle={`${rows.length} item${rows.length === 1 ? "" : "s"}`}>
      {loading ? (
        <p className="text-center text-muted-foreground py-10">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="p-10 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => navigate("/marketplace")} className="glow-btn text-primary-foreground">Browse Marketplace</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => r.marketplace_items && (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="glass border-0">
                <CardContent className="p-3 flex gap-3 items-center">
                  <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0">
                    {r.marketplace_items.image_url && (
                      <img src={r.marketplace_items.image_url} alt={r.marketplace_items.name} loading="lazy" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{r.marketplace_items.name}</h3>
                    <p className="text-xs text-muted-foreground">₹{r.marketplace_items.price} / {r.marketplace_items.unit}</p>
                    <p className="text-primary font-bold mt-1">₹{(r.marketplace_items.price * r.quantity).toFixed(0)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="w-7 h-7" onClick={() => update(r.id, r.quantity - 1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-7 text-center text-sm font-semibold">{r.quantity}</span>
                      <Button size="icon" variant="outline" className="w-7 h-7" onClick={() => update(r.id, r.quantity + 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive" onClick={() => remove(r.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          <Card className="glass border-0 sticky bottom-4">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-primary">₹{total.toFixed(0)}</p>
              </div>
              <Button
                className="glow-btn text-primary-foreground"
                onClick={() => toast.success("Order placed! We'll contact you shortly.")}
              >
                Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
