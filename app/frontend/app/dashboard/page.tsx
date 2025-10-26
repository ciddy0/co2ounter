import Heatmap from "../../components/dashboard/heatmap";
import PromptCard from "../../components/dashboard/promptcard";
import DailyCards from "../../components/dashboard/cards";
import CO2Card from "../../components/dashboard/co2card";
import WeeklyChart from "../../components/dashboard/weeklychart";
import databaseValues from "../../data.js";
import Offset from "../../components/dashboard/offset";
import MiniLeaderboard from "../../components/dashboard/mini-leaderboard";

export default function Dashboard() {
  return (
    <div className="container mx-auto py-12">
      <div className="w-full flex justify-between items-center my-6 ">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <Offset />
      </div>

      <div className="w-full grid grid-cols-4 gap-4 my-4">
        <DailyCards number={10} title="Today's Prompts" increment={5} />
        <PromptCard number={130} title="Lifetime Prompts" increment={40} />
        <DailyCards number={10} title="Today's CO2 Emissions" increment={-5} />
        <CO2Card number={676} title="Lifetime CO2 Emissions" increment={10} />
      </div>
      <div className="w-full flex gap-4 items-stretch my-4">
        <div className="w-2/3">
          <WeeklyChart title="Weekly Prompts" data={databaseValues} />
        </div>
        <div className="w-1/3">
          <MiniLeaderboard />
        </div>
      </div>
      <Heatmap />
    </div>
  );
}
