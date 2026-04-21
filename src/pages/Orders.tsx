import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle2, Truck, XCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";

type OrderItem = { id: string; item_name: string; price: number; quantity: number; unit: string };
type Order = {
  id: string; total: number; status: string; created_at: string;
  shipping_address: string | null; phone: string | null;
  order_items: OrderItem[];
};

const STATUS: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-amber-500/15 text-amber-600 border-amber-500/30", label: "Pending" },
  confirmed: { icon: CheckCircle2, color: "bg-sky-500/15 text-sky-600 border-sky-500/30", label: "Confirmed" },
  shipped: { icon: Truck, color: "bg-violet-500/15 text-violet-600 border-violet-500/30", label: "Shipped" },
  delivered: { icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", label: "Delivered" },
  cancelled: { icon: XCircle, color: "bg-rose-500/15 text-rose-600 border-rose-500/30", label: "Cancelled" },
};

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("id, total, status, created_at, shipping_address, phone, order_items(id, item_name, price, quantity, unit)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrders((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("orders-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error("Couldn't cancel order");
    else toast.success("Order cancelled");
  };

  return (
    <PageShell title="Your Orders" subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"}`}>
      {loading ? (
        <p className="text-center text-muted-foreground py-10">Loading…</p>
      ) : orders.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="p-10 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
            <Button onClick={() => navigate("/marketplace")} className="glow-btn text-primary-foreground">Browse Marketplace</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o, i) => {
            const s = STATUS[o.status] ?? STATUS.pending;
            const SIcon = s.icon;
            return (
              <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="glass border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                      </div>
                      <Badge variant="outline" className={s.color}>
                        <SIcon className="w-3 h-3 mr-1" /> {s.label}
                      </Badge>
                    </div>
                    <div className="space-y-1 mb-3">
                      {o.order_items.map((it) => (
                        <div key={it.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{it.item_name} × {it.quantity} {it.unit}</span>
                          <span>₹{(it.price * it.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="font-bold text-lg text-primary">₹{Number(o.total).toFixed(0)}</span>
                      {o.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => cancel(o.id)}>Cancel</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
