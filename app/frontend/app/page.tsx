"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 gap-4 font-sans dark:bg-black">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Welcome to CO₂ounter
      </h1>

      <Link href="/login">
        <button className="w-48 px-6 py-2 rounded-full bg-blue-700 text-white hover:bg-blue-700 transition">
          Login
        </button>
      </Link>

      <Link href="/register">
        <button className="w-48 px-6 py-2 rounded-full bg-green-700 text-white hover:bg-green-700 transition">
          Register
        </button>
      </Link>
    </div>
  );
}
