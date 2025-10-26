import Heatmap from "../../components/dashboard/heatmap";
import PromptCard from "../../components/dashboard/promptcard";
import DailyCards from "../../components/dashboard/cards";
import CO2Card from "../../components/dashboard/co2card";
import WeeklyChart from "../../components/dashboard/weeklychart";
import databaseValues from "../../data.js";

export default function Dashboard() {
  return (
    <div className="p-6 min-w-full">
      <div className="w-full grid grid-cols-4 gap-4">
        <DailyCards number={10} title="Today's Prompts" increment={5} />
        <PromptCard number={130} title="Lifetime Prompts" increment={40} />
        <DailyCards number={10} title="Today's CO2 Emissions" increment={-5} />
        <CO2Card number={676} title="Lifetime CO2 Emissions" increment={10} />
      </div>
      <Heatmap />
      <div className="w-2/3">
        <WeeklyChart title="Weekly CO2 Emissions" data={databaseValues} />
      </div>
    </div>
  );
}
