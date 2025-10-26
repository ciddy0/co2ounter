"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

interface DataPoint {
  date: Date;
  count: number;
}

interface WeeklyChartProps {
  title?: string;
  data: DataPoint[];
}

const WeeklyChart = ({
  title = "Project Analytics",
  data,
}: WeeklyChartProps) => {
  console.log("📊 Weekly Chart - Input data:", data);

  // Get current week starting from Sunday
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const chartData = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dayData = data.find((item) => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);

      const matches = itemDate.getTime() === date.getTime();

      console.log(
        `Comparing ${
          dayNames[i]
        } - Expected: ${date.toDateString()}, Item: ${itemDate.toDateString()}, Match: ${matches}, Count: ${
          item.count
        }`
      );

      return matches;
    });

    chartData.push({
      day: dayNames[i],
      count: dayData ? dayData.count : 0,
      hasData: !!dayData,
    });
  }

  console.log("📈 Final chartData:", chartData);

  // Calculate max value for color scaling - ensure at least 1 to avoid issues
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  // Custom bar colors based on count
  const getBarColor = (count: number) => {
    if (count === 0) return "#e5e7eb"; // gray for empty bars
    if (count >= maxCount * 0.8) return "#4a6b8a";
    if (count >= maxCount * 0.6) return "#6b96c1";
    if (count >= maxCount * 0.4) return "#5aa7db";
    if (count >= maxCount * 0.2) return "#8cc4e8";
    return "#c8e1f5";
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-3xl h-full">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="flex-1 relative z-10 min-h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            barCategoryGap="15%"
          >
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: "500" }}
            />
            <YAxis hide />
            <Bar dataKey="count" radius={[40, 40, 40, 40]} minPointSize={5}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.count)} />
              ))}
            </Bar>
            <Tooltip
              contentStyle={{
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "6px 12px",
                fontSize: "14px",
                color: "#374151",
                fontWeight: "500",
                zIndex: 1000,
              }}
              labelStyle={{ display: "none" }}
              formatter={(value: number) => [`Prompts: ${value}`]}
              cursor={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyChart;
