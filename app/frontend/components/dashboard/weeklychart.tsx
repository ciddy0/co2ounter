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
  // Get current week starting from Sunday
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek);

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const chartData = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);

    // Find data for this date
    const dayData = data.find((item) => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      return itemDate.toDateString() === date.toDateString();
    });

    chartData.push({
      day: dayNames[i],
      count: dayData ? dayData.count : 0,
      hasData: !!dayData,
    });
  }

  // Calculate max value for color scaling
  const maxCount = Math.max(...chartData.map((d) => d.count));

  // Custom bar colors based on count
  const getBarColor = (count: number) => {
    if (count === 0) return "#f3f4f6"; // gray-100 for no data
    if (count >= maxCount * 0.8) return "#166534"; // green-800
    if (count >= maxCount * 0.5) return "#16a34a"; // green-600
    return "#4ade80"; // green-400
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>

      <div className="h-40 relative z-10">
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
            <Bar dataKey="count" radius={[40, 40, 40, 40]}>
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
