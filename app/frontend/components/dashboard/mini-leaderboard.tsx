import { MoveRight } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  name: string;
  promptCount: number;
  co2Count: number;
  isCurrentUser?: boolean;
}

const MiniLeaderboard = () => {
  // mock data
  const currentUser = { name: "You", promptCount: 130, co2Count: 45 };
  const allUsers: Omit<LeaderboardEntry, "rank" | "isCurrentUser">[] = [
    { name: "Neal", promptCount: 250, co2Count: 89 },
    { name: "Jelena", promptCount: 220, co2Count: 78 },
    { name: "Bradley", promptCount: 180, co2Count: 62 },
    { name: "Cid", promptCount: 165, co2Count: 58 },
    { name: "Sophia", promptCount: 140, co2Count: 48 },
    { name: "You", promptCount: 130, co2Count: 45 },
    { name: "Angie", promptCount: 120, co2Count: 42 },
  ];

  // sorted by prompt ct
  const sortedUsers = allUsers
    .sort((a, b) => b.promptCount - a.promptCount)
    .map((user, index) => ({
      ...user,
      rank: index + 1,
      isCurrentUser: user.name === currentUser.name,
    }));

  const currentUserRank =
    sortedUsers.find((user) => user.isCurrentUser)?.rank || 0;

  let displayUsers: LeaderboardEntry[];
  if (currentUserRank <= 5) {
    // top 5 if user is in top 5
    displayUsers = sortedUsers.slice(0, 5);
  } else {
    // top 4 + current user
    displayUsers = [
      ...sortedUsers.slice(0, 4),
      sortedUsers[currentUserRank - 1],
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
          className="flex justify-end items-center gap-2 cursor-pointer"
        >
          <h4 className="text-sm text-gray-500">See more</h4>
          <MoveRight className="w-4 h-4 text-gray-500" />
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-500 py-2">
        <div>Rank</div>
        <div>Name</div>
        <div className="text-right">Prompts</div>
        <div className="text-right">CO2</div>
      </div>

      <div className="space-y-2">
        {displayUsers.map((user) => (
          <div
            key={`${user.rank}-${user.name}`}
            className={`grid grid-cols-4 gap-2 p-3 ${
              user.isCurrentUser ? "bg-blue-50 rounded-3xl" : ""
            }`}
          >
            <div className={"font-semibold text-gray-600 "}>
              {user.rank.toString()}
            </div>

            <div className={"font-medium text-gray-800"}>{user.name}</div>

            <div className="text-right font-medium text-gray-700">
              {user.promptCount.toLocaleString()}
            </div>

            <div className="text-right font-medium text-gray-700">
              {user.co2Count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniLeaderboard;
