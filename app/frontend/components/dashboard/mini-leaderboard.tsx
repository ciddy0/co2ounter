"use client";
import { useEffect, useState } from "react";
import { MoveRight } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  uid: string;
  rank: number;
  username: string;
  promptTotal: number;
  co2Total: number;
  isCurrentUser?: boolean;
}

const MiniLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem("firebaseToken");
      
      if (!token) {
        return;
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch("http://localhost:4000/leaderboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!leaderboardResponse.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const leaderboardResult = await leaderboardResponse.json();

      // Fetch current user stats to find their position
      const statsResponse = await fetch("http://localhost:4000/api/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statsResponse.ok) {
        throw new Error("Failed to fetch user stats");
      }

      const statsData = await statsResponse.json();
      const currentUsername = statsData.user.username;

      // Process leaderboard data
      const formattedData: LeaderboardEntry[] = leaderboardResult.data.map(
        (entry: any, index: number) => ({
          uid: entry.uid,
          rank: index + 1,
          username: entry.username || "Anonymous",
          promptTotal: entry.promptTotal || 0,
          co2Total: parseFloat((entry.co2Total || 0).toFixed(2)), // Keep in grams
          isCurrentUser: entry.username === currentUsername,
        })
      );

      setLeaderboardData(formattedData);

      // Find current user's rank
      const userEntry = formattedData.find((entry) => entry.isCurrentUser);
      setCurrentUserRank(userEntry?.rank || 0);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col p-6 bg-white rounded-3xl h-full">
        <h2 className="text-xl font-semibold text-gray-800 pb-2">
          Top AI Demons
        </h2>
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Determine which users to display
  let displayUsers: LeaderboardEntry[];
  if (currentUserRank <= 5 || currentUserRank === 0) {
    // Show top 5 if user is in top 5 or not found
    displayUsers = leaderboardData.slice(0, 5);
  } else {
    // Show top 4 + current user
    displayUsers = [
      ...leaderboardData.slice(0, 4),
      leaderboardData[currentUserRank - 1],
    ];
  }

  return (
    <div className="flex flex-col p-6 bg-white rounded-3xl h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 pb-2">
          Top AI Demons
        </h2>
        <Link
          href="/leaderboard"
          className="flex justify-end items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
        >
          <h4 className="text-sm text-gray-500">See more</h4>
          <MoveRight className="w-4 h-4 text-gray-500" />
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-500 py-2">
        <div>Rank</div>
        <div>Name</div>
        <div className="text-right">Prompts</div>
        <div className="text-right">CO2 (g)</div>
      </div>

      <div className="space-y-2">
        {displayUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No leaderboard data available
          </div>
        ) : (
          displayUsers.map((user) => (
            <div
              key={`${user.rank}-${user.uid}`}
              className={`grid grid-cols-4 gap-2 p-3 transition-colors ${
                user.isCurrentUser
                  ? "bg-blue-50 rounded-3xl font-semibold"
                  : "hover:bg-gray-50 rounded-3xl"
              }`}
            >
              <div className="font-semibold text-gray-600">
                {user.rank.toString()}
              </div>

              <div className="font-medium text-gray-800">
                {user.isCurrentUser ? "You" : user.username}
              </div>

              <div className="text-right font-medium text-gray-700">
                {user.promptTotal.toLocaleString()}
              </div>

              <div className="text-right font-medium text-gray-700">
                {user.co2Total}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MiniLeaderboard;