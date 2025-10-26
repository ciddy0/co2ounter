"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DailyCards from "../../components/dashboard/cards";
import CO2Card from "../../components/dashboard/co2card";
import PromptCard from "../../components/dashboard/promptcard";
import WeeklyChart from "../../components/dashboard/weeklychart";
import MiniLeaderboard from "../../components/dashboard/mini-leaderboard";
import Heatmap from "../../components/dashboard/heatmap";
import Offset from "@/components/dashboard/offset";
import { Button } from "@/components/ui/button";

interface DashboardData {
  user: {
    username: string;
    promptTotal: number;
    co2Total: number;
    outputTokens: number;
    dailyLimitPrompts: number;
    dailyLimitCo2: number;
    modelTotals?: {
      [key: string]: {
        co2: number;
        prompts: number;
        outputTokens: number;
      };
    };
  };
  today: {
    promptCount: number;
    co2Total: number;
    outputTokens: number;
  };
  yesterday?: {
    promptCount: number;
    co2Total: number;
    outputTokens: number;
  };
  weekHistory: Array<{ date: Date; count: number }>;
  yearHistory: Array<{ date: Date; count: number }>;
  exceeded: {
    prompts: boolean;
    co2: boolean;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("firebaseToken");

      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch current stats
      const statsResponse = await fetch("http://localhost:4000/api/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statsResponse.ok) {
        if (statsResponse.status === 401) {
          localStorage.removeItem("firebaseToken");
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch stats");
      }

      const statsData = await statsResponse.json();

      // Fetch history data
      const historyResponse = await fetch(
        "http://localhost:4000/api/history/year",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const historyData = historyResponse.ok
        ? await historyResponse.json()
        : { history: [] };

      // Process history data
      const yearHistory = processYearHistory(historyData.history || []);
      const weekHistory = getLast7Days(historyData.history || []);
      const yesterday = getYesterdayData(historyData.history || []);

      setData({
        user: statsData.user,
        today: statsData.today,
        yesterday,
        weekHistory,
        yearHistory,
        exceeded: statsData.exceeded,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const processYearHistory = (
    history: any[]
  ): Array<{ date: Date; count: number }> => {
    return history.map((entry: any) => ({
      date: entry.date
        ? new Date(entry.date)
        : new Date(entry.timestamp?.toDate?.() || entry.timestamp),
      count: entry.promptCount || 0,
    }));
  };

  const getLast7Days = (
    history: any[]
  ): Array<{ date: Date; count: number }> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last7Days: Array<{ date: Date; count: number }> = [];

    // Create a map of date strings to history entries for faster lookup
    const historyMap = new Map();
    history.forEach((entry: any) => {
      // entry.date is the YYYY-MM-DD string from document ID
      if (entry.date) {
        historyMap.set(entry.date, entry);
      }
    });

    // Generate last 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      // Format date as YYYY-MM-DD to match document IDs
      const dateKey = date.toISOString().split("T")[0];
      const dayEntry = historyMap.get(dateKey);

      last7Days.push({
        date,
        count: dayEntry?.promptCount || 0,
      });
    }

    console.log("📅 Last 7 Days Data:", last7Days);
    return last7Days;
  };

const getYesterdayData = (history: any[]) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0]; // Format as YYYY-MM-DD

  const yesterdayEntry = history.find((entry: any) => entry.date === yesterdayKey);

  return yesterdayEntry
    ? {
        promptCount: yesterdayEntry.promptCount || 0,
        co2Total: yesterdayEntry.co2Total || 0,
        outputTokens: yesterdayEntry.outputTokens || 0,
      }
    : { promptCount: 0, co2Total: 0, outputTokens: 0 };
};

  const calculateDailyAverage = (total: number): number => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const daysPassed = Math.floor(
      (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysPassed > 0 ? Math.round(total / daysPassed) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p>{error || "Failed to load dashboard data"}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const promptIncrement =
  data.today.promptCount - (data.yesterday?.promptCount || 0);
  const co2Increment = data.today.co2Total - (data.yesterday?.co2Total || 0);
  const dailyPromptsAvg = calculateDailyAverage(data.user.promptTotal);
  const dailyCo2Avg = calculateDailyAverage(data.user.co2Total);

  return (
    <div className="container mx-auto py-12 px-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">
            Welcome back, {data.user.username || "User"}!
          </h1>
          <p className="text-gray-600 mt-1">
            Track your AI usage and carbon footprint
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Offset />
          <Button
            onClick={() => {
              localStorage.removeItem("firebaseToken");
              router.push("/login");
            }}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Limit Warnings */}
      {(data.exceeded.prompts || data.exceeded.co2) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">
            ⚠️ Daily Limits Exceeded
          </h3>
          {data.exceeded.prompts && (
            <p className="text-sm text-red-700">
              You've exceeded your daily prompt limit (
              {data.user.dailyLimitPrompts})
            </p>
          )}
          {data.exceeded.co2 && (
            <p className="text-sm text-red-700">
              You've exceeded your daily CO2 limit ({data.user.dailyLimitCo2}g)
            </p>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <DailyCards
          number={data.today.promptCount || 0}
          title="Today's Prompts"
          increment={promptIncrement}
        />
        <PromptCard
          number={data.user.promptTotal || 0}
          title="Total Prompts"
          increment={dailyPromptsAvg}
        />
        <DailyCards
          number={parseFloat((data.today.co2Total || 0).toFixed(2))}
          title="Today's CO2 (g)"
          increment={parseFloat(co2Increment.toFixed(2))}
        />
        <CO2Card
          number={parseFloat((data.user.co2Total || 0).toFixed(2))}
          title="Total CO2 (g)"
          increment={parseFloat(dailyCo2Avg.toFixed(2))}
        />
      </div>

      {/* Charts Grid */}
      <div className="flex gap-6 mb-4">
        <div className="w-2/3">
          <WeeklyChart title=" Weekly Activity" data={data.weekHistory} />
        </div>
        <MiniLeaderboard />
      </div>

      {/* Heatmap */}
      <div className="mb-4">
        <Heatmap data={data.yearHistory} totalPrompts={data.user.promptTotal} />
      </div>
    </div>
  );
}
