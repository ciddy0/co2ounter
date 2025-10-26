"use client";

import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface LeaderboardEntry {
  uid: string;
  rank: number;
  username: string;
  promptTotal: number;
  co2Total: number;
  isCurrentUser?: boolean;
}

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem("firebaseToken");
      if (!token) return;

      // 1️⃣ Fetch leaderboard
      const leaderboardResponse = await fetch("http://localhost:4000/leaderboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!leaderboardResponse.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const leaderboardResult = await leaderboardResponse.json();

      // 2️⃣ Fetch user info to identify current user
      const statsResponse = await fetch("http://localhost:4000/api/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!statsResponse.ok) throw new Error("Failed to fetch user stats");

      const statsData = await statsResponse.json();
      const username = statsData.user.username;
      setCurrentUser(username);

      // 3️⃣ Format data
      const formatted = leaderboardResult.data.map((entry: any, index: number) => ({
        uid: entry.uid,
        rank: index + 1,
        username: entry.username || "Anonymous",
        promptTotal: entry.promptTotal || 0,
        co2Total: parseFloat((entry.co2Total / 1000).toFixed(2)) || 0, // g → kg
        isCurrentUser: entry.username === username,
      }));

      setLeaderboardData(formatted);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(leaderboardData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = leaderboardData.slice(startIndex, endIndex);

  // top 3 on first page
  const topThree = currentPage === 1 ? leaderboardData.slice(0, 3) : [];
  const displayUsers =
    currentPage === 1 ? leaderboardData.slice(3, itemsPerPage) : currentUsers;

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800";
    if (rank === 2) return "bg-gray-200 text-gray-800";
    if (rank === 3) return "bg-orange-100 text-orange-800";
    return "bg-gray-200 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 space-y-8">
      <div className="pb-2">
        <Link href="/dashboard">
          <MoveLeft className="cursor-pointer" />
        </Link>
      </div>
      <h2 className="text-3xl font-semibold text-gray-800">Top AI Demons</h2>

      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topThree.map((user) => (
          <div
            key={user.uid}
            className={`bg-white rounded-3xl p-6 shadow-sm border ${
              user.isCurrentUser ? "ring-2 ring-blue-200" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.username.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {user.isCurrentUser ? `You (${user.username})` : user.username}
                  </h3>
                </div>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${getRankBadgeColor(
                  user.rank
                )}`}
              >
                {user.rank}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Total Prompts</p>
                <p className="font-semibold text-gray-800">
                  {user.promptTotal.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Total CO2 (kg)</p>
                <p className="font-semibold text-gray-800">
                  {user.co2Total}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginated users */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="space-y-4">
          {displayUsers.map((user) => (
            <div
              key={user.uid}
              className={`flex items-center justify-between p-4 rounded-2xl ${
                user.isCurrentUser ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.rank}
                  </span>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.username.charAt(0)}
                  </span>
                </div>
                <h4 className="font-medium text-gray-800">
                  {user.isCurrentUser ? `You (${user.username})` : user.username}
                </h4>
              </div>

              <div className="flex gap-16 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Prompts</p>
                  <p className="font-semibold text-gray-800">
                    {user.promptTotal.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">CO2 (kg)</p>
                  <p className="font-semibold text-gray-800">
                    {user.co2Total}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={
                currentPage === 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
