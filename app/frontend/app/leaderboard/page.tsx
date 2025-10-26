"use client";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface LeaderboardEntry {
  rank: number;
  name: string;
  promptCount: number;
  co2Count: number;
  isCurrentUser?: boolean;
}

export default function Leaderboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // mock data
  const currentUser = { name: "Neal", promptCount: 250, co2Count: 89 };
  const allUsers: Omit<LeaderboardEntry, "rank" | "isCurrentUser">[] = [
    { name: "Neal", promptCount: 250, co2Count: 89 },
    { name: "Jelena", promptCount: 220, co2Count: 78 },
    { name: "Bradley", promptCount: 180, co2Count: 62 },
    { name: "Cid", promptCount: 165, co2Count: 58 },
    { name: "Sophia", promptCount: 140, co2Count: 48 },
    { name: "Angie", promptCount: 120, co2Count: 42 },
    { name: "Marcus", promptCount: 115, co2Count: 38 },
    { name: "Elena", promptCount: 108, co2Count: 35 },
    { name: "David", promptCount: 95, co2Count: 32 },
    { name: "Sarah", promptCount: 88, co2Count: 29 },
    { name: "Alex", promptCount: 82, co2Count: 27 },
    { name: "Maya", promptCount: 76, co2Count: 25 },
    { name: "Jordan", promptCount: 71, co2Count: 23 },
    { name: "Luna", promptCount: 65, co2Count: 21 },
    { name: "Ryan", promptCount: 58, co2Count: 19 },
    { name: "Zoe", promptCount: 52, co2Count: 17 },
    { name: "Kai", promptCount: 47, co2Count: 15 },
    { name: "Mia", promptCount: 41, co2Count: 13 },
    { name: "Leo", promptCount: 35, co2Count: 11 },
    { name: "Aria", promptCount: 28, co2Count: 9 },
  ];

  // sorted by prompt ct
  const sortedUsers = allUsers
    .sort((a, b) => b.promptCount - a.promptCount)
    .map((user, index) => ({
      ...user,
      rank: index + 1,
      isCurrentUser: user.name === currentUser.name,
    }));

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = sortedUsers.slice(startIndex, endIndex);

  // top 3 on first page, then paginated results
  const topThree = currentPage === 1 ? sortedUsers.slice(0, 3) : [];
  const displayUsers =
    currentPage === 1 ? sortedUsers.slice(3, itemsPerPage) : currentUsers;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "1";
    if (rank === 2) return "2";
    if (rank === 3) return "3";
    return rank.toString();
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800";
    if (rank === 2) return "bg-gray-200 text-gray-800";
    if (rank === 3) return "bg-orange-100 text-orange-800";
    return "bg-gray-200 text-gray-800";
  };

  return (
    <div className="container mx-auto py-12 space-y-8">
      <div className="pb-2">
        <Link href="/dashboard">
          <MoveLeft className="cursor-pointer" />
        </Link>
      </div>
      <h2 className="text-3xl font-semibold text-gray-800">Top AI Demons</h2>

      {/* top 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topThree.map((user) => (
          <div
            key={`${user.rank}-${user.name}`}
            className={`bg-white rounded-3xl p-6 shadow-sm border ${
              user.isCurrentUser ? "ring-2 ring-blue-200" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {user.isCurrentUser ? `You (${user.name})` : user.name}
                  </h3>
                </div>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${getRankBadgeColor(
                  user.rank
                )}`}
              >
                {getRankIcon(user.rank)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Total Prompts</p>
                <p className="font-semibold text-gray-800">
                  {user.promptCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Total CO2</p>
                <p className="font-semibold text-gray-800">{user.co2Count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* users list */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="space-y-4">
          {displayUsers.map((user) => (
            <div
              key={`${user.rank}-${user.name}`}
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
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">
                    {user.isCurrentUser ? `You (${user.name})` : user.name}
                  </h4>
                </div>
              </div>

              <div className="flex gap-16 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Total Prompts</p>
                  <p className="font-semibold text-gray-800">
                    {user.promptCount.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Total CO2</p>
                  <p className="font-semibold text-gray-800">{user.co2Count}</p>
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
