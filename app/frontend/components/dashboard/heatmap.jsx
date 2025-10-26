"use client";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip } from "react-tooltip";
import "./heatmap.css";

const Heatmap = ({ data }) => {
  const today = new Date();

  const shiftDate = (date, days) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  const generateCompleteValues = () => {
    const startDate = shiftDate(today, -364);
    const endDate = today;
    const completeValues = [];

    // Create a map from the data prop
    const dataMap = new Map(); // ✅ FIXED: Declare the Map
    
    if (data && Array.isArray(data)) {
      data.forEach((item) => {
        // ✅ FIXED: Use getUTCMonth() + 1 for correct month
        const dateKey = `${item.date.getUTCFullYear()}-${item.date.getUTCMonth() + 1}-${item.date.getUTCDate()}`;
        dataMap.set(dateKey, item.count);
      });
    }

    // Fill in all dates for the past year
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = `${currentDate.getUTCFullYear()}-${currentDate.getUTCMonth() + 1}-${currentDate.getUTCDate()}`;
      completeValues.push({
        date: new Date(currentDate),
        count: dataMap.get(dateKey) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return completeValues;
  };

  const values = generateCompleteValues();

  // Calculate total prompts from the data prop
  const totalPrompts =
    data && Array.isArray(data)
      ? data.reduce((sum, item) => sum + item.count, 0)
      : 0;

  // Calculate max count for scaling
  const maxCount = data && Array.isArray(data) && data.length > 0
    ? Math.max(...data.map((d) => d.count), 1) // Minimum of 1 to avoid division by zero
    : 1;

  return (
    <div className="flex flex-col gap-4 p-6 bg-white rounded-3xl h-full">
      <h2 className="text-xl font-semibold text-gray-800">
        {totalPrompts} prompts in the last year
      </h2>
      <div className="flex-1">
        <CalendarHeatmap
          startDate={shiftDate(today, -364)}
          endDate={today}
          values={values}
          classForValue={(value) => {
            if (!value || value.count === 0) {
              return "color-empty";
            }

            // ✅ FIXED: Use maxCount from the outer scope instead of undefined databaseValues
            let level;
            if (value.count >= maxCount * 0.8) level = 5;
            else if (value.count >= maxCount * 0.6) level = 4;
            else if (value.count >= maxCount * 0.4) level = 3;
            else if (value.count >= maxCount * 0.2) level = 2;
            else level = 1;

            return `color-${level}`;
          }}
          tooltipDataAttrs={(value) => {
            if (!value || !value.date) {
              return {
                "data-tooltip-id": "heatmap-tooltip",
                "data-tooltip-content": "No data available",
              };
            }
            if (value.count === 0) {
              return {
                "data-tooltip-id": "heatmap-tooltip",
                "data-tooltip-content": `No prompts on ${value.date.toDateString()}`,
              };
            }
            return {
              "data-tooltip-id": "heatmap-tooltip",
              "data-tooltip-content": `${
                value.count
              } prompts on ${value.date.toDateString()}`,
            };
          }}
          showMonthLabels
          showWeekdayLabels
        />
      </div>
      <Tooltip id="heatmap-tooltip" />
    </div>
  );
};

export default Heatmap;
