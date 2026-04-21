import DashboardHeader from "@/components/DashboardHeader";
import FertilizerCalculator from "@/components/FertilizerCalculator";
import SeasonalRecommendation from "@/components/SeasonalRecommendation";
import WeatherWidget from "@/components/WeatherWidget";
import QuickActions from "@/components/QuickActions";

export default function Dashboard() {
  return (
    <div className="min-h-screen relative">
      {/* Ambient gradient background */}
      <div className="fixed inset-0 -z-10 bg-background">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <DashboardHeader />
        <div className="space-y-6">
          <FertilizerCalculator />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SeasonalRecommendation />
            <WeatherWidget />
          </div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
