import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let lat = parseFloat(url.searchParams.get("lat") ?? "");
    let lon = parseFloat(url.searchParams.get("lon") ?? "");
    let locationName = url.searchParams.get("location") ?? "";

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (typeof body.lat === "number") lat = body.lat;
      if (typeof body.lon === "number") lon = body.lon;
      if (typeof body.location === "string") locationName = body.location;
    }

    // If a text location is provided, geocode it via Open-Meteo geocoding
    if ((!Number.isFinite(lat) || !Number.isFinite(lon)) && locationName) {
      const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=en`);
      const gd = await geo.json();
      const first = gd?.results?.[0];
      if (first) { lat = first.latitude; lon = first.longitude; locationName = `${first.name}${first.admin1 ? ", " + first.admin1 : ""}`; }
    }

    // Default: India centroid
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) { lat = 20.5937; lon = 78.9629; locationName ||= "India"; }

    const api = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=4&timezone=auto`;
    const resp = await fetch(api);
    if (!resp.ok) throw new Error(`Weather API ${resp.status}`);
    const data = await resp.json();

    return new Response(JSON.stringify({
      location: locationName,
      lat, lon,
      current: data.current,
      daily: data.daily,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("weather error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
