"use client";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip } from "react-tooltip";
import "./heatmap.css";
import databaseValues from "../../data.js";

const Heatmap = () => {
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

    const dataMap = new Map();
    databaseValues.forEach((item) => {
      const dateKey = item.date.toDateString();
      dataMap.set(dateKey, item.count);
    });

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toDateString();
      completeValues.push({
        date: new Date(currentDate),
        count: dataMap.get(dateKey) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return completeValues;
  };

  const values = generateCompleteValues();
  const totalPrompts = databaseValues.reduce(
    (sum, item) => sum + item.count,
    0
  );

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

            // Scale the count to 1-4 range based on your data
            const maxCount = Math.max(...databaseValues.map((d) => d.count));

            // Map count to 1-5 scale (better granularity)
            let level;
            if (value.count >= maxCount * 0.8) level = 5; // Darkest
            else if (value.count >= maxCount * 0.6) level = 4; // Very dark
            else if (value.count >= maxCount * 0.4) level = 3; // Medium
            else if (value.count >= maxCount * 0.2) level = 2; // Light
            else level = 1; // Very light

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
