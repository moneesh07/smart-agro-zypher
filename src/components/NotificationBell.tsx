import { useEffect, useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type N = { id: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string };

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<N[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as any) ?? []);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("notif-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as N;
          setItems((prev) => [n, ...prev].slice(0, 20));
          toast(n.title, { description: n.body ?? undefined });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        load
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const unread = items.filter((i) => !i.read).length;

  const open = async (n: N) => {
    if (!n.read) await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  const clear = async () => {
    if (!user) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 z-50 bg-popover">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <p className="font-semibold text-sm">Notifications</p>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={markAll} aria-label="Mark all read">
              <Check className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={clear} aria-label="Clear all">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-80">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No notifications yet</p>
          ) : (
            <div className="divide-y divide-border">
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
