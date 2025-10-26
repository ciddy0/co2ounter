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
  return (
    <div>
      <CalendarHeatmap
        startDate={shiftDate(today, -364)}
        endDate={today}
        values={values}
        classForValue={(value) => {
          if (!value) {
            return "color-empty";
          }
          return `color-github-${value.count}`;
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
        onClick={(value) => console.log(value)}
      />
      <Tooltip id="heatmap-tooltip" />
    </div>
  );
};

export default Heatmap;
