"use client";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip } from "react-tooltip";
import "./heatmap.css";

const databaseValues = [
  // October 2025 (recent days)
  { date: new Date(2025, 9, 24), count: 3 },
  { date: new Date(2025, 9, 23), count: 2 },
  { date: new Date(2025, 9, 22), count: 1 },
  { date: new Date(2025, 9, 20), count: 4 },
  { date: new Date(2025, 9, 18), count: 2 },
  { date: new Date(2025, 9, 15), count: 3 },
  { date: new Date(2025, 9, 12), count: 1 },
  { date: new Date(2025, 9, 10), count: 2 },
  { date: new Date(2025, 9, 8), count: 4 },
  { date: new Date(2025, 9, 5), count: 1 },
  { date: new Date(2025, 9, 3), count: 3 },
  { date: new Date(2025, 9, 1), count: 2 },

  // September 2025
  { date: new Date(2025, 8, 28), count: 2 },
  { date: new Date(2025, 8, 25), count: 4 },
  { date: new Date(2025, 8, 22), count: 1 },
  { date: new Date(2025, 8, 20), count: 3 },
  { date: new Date(2025, 8, 18), count: 2 },
  { date: new Date(2025, 8, 15), count: 1 },
  { date: new Date(2025, 8, 12), count: 4 },
  { date: new Date(2025, 8, 10), count: 3 },
  { date: new Date(2025, 8, 8), count: 2 },
  { date: new Date(2025, 8, 5), count: 1 },

  // August 2025
  { date: new Date(2025, 7, 30), count: 3 },
  { date: new Date(2025, 7, 28), count: 2 },
  { date: new Date(2025, 7, 25), count: 4 },
  { date: new Date(2025, 7, 22), count: 1 },
  { date: new Date(2025, 7, 20), count: 3 },
  { date: new Date(2025, 7, 18), count: 2 },
  { date: new Date(2025, 7, 15), count: 1 },
  { date: new Date(2025, 7, 12), count: 4 },
  { date: new Date(2025, 7, 10), count: 2 },
  { date: new Date(2025, 7, 8), count: 3 },
  { date: new Date(2025, 7, 5), count: 1 },

  // July 2025
  { date: new Date(2025, 6, 30), count: 2 },
  { date: new Date(2025, 6, 28), count: 4 },
  { date: new Date(2025, 6, 25), count: 1 },
  { date: new Date(2025, 6, 22), count: 3 },
  { date: new Date(2025, 6, 20), count: 2 },
  { date: new Date(2025, 6, 18), count: 1 },
  { date: new Date(2025, 6, 15), count: 4 },
  { date: new Date(2025, 6, 12), count: 3 },
  { date: new Date(2025, 6, 10), count: 2 },
  { date: new Date(2025, 6, 8), count: 1 },
  { date: new Date(2025, 6, 5), count: 3 },

  // June 2025
  { date: new Date(2025, 5, 28), count: 2 },
  { date: new Date(2025, 5, 25), count: 4 },
  { date: new Date(2025, 5, 22), count: 1 },
  { date: new Date(2025, 5, 20), count: 3 },
  { date: new Date(2025, 5, 18), count: 2 },
  { date: new Date(2025, 5, 15), count: 1 },

  // May 2025
  { date: new Date(2025, 4, 30), count: 3 },
  { date: new Date(2025, 4, 28), count: 2 },
  { date: new Date(2025, 4, 25), count: 4 },
  { date: new Date(2025, 4, 22), count: 1 },
  { date: new Date(2025, 4, 20), count: 3 },
  { date: new Date(2025, 4, 18), count: 2 },

  // April 2025
  { date: new Date(2025, 3, 28), count: 1 },
  { date: new Date(2025, 3, 25), count: 4 },
  { date: new Date(2025, 3, 22), count: 2 },
  { date: new Date(2025, 3, 20), count: 3 },
  { date: new Date(2025, 3, 18), count: 1 },
  { date: new Date(2025, 3, 15), count: 2 },

  // November 2024 (365 days ago from Oct 25, 2025)
  { date: new Date(2024, 10, 30), count: 2 },
  { date: new Date(2024, 10, 28), count: 1 },
  { date: new Date(2024, 10, 26), count: 3 },
];

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
