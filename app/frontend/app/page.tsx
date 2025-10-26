"use client";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [activeSection, setActiveSection] = useState("home"); // home, docs, team

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return (
          <div className="flex flex-col items-center justify-center flex-1 px-4 text-center space-y-6">
            <h1 className="text-3xl mb-0 font-bold text-black dark:text-white">
              co2ounter
            </h1>
            <h2 className="text-xl font-semibold text-[#BC9E9E] dark:text-white">
              Track and reduce your AI carbon impact.
            </h2>
            <a
              href="#"
              className="px-8 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
            >
              Download
            </a>
            <div className="w-full max-w-md h-64 bg-gray-200 dark:bg-gray-800 rounded-md flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">
                Placeholder Image
              </span>
            </div>
          </div>
        );
      case "docs":
        return (
          <div className="flex flex-col items-center justify-center flex-1 px-4 text-center">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Documentation
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Here you can find guides and API references for co2ounter.
            </p>
          </div>
        );
      case "team":
        return (
          <div className="flex flex-col items-center justify-center flex-1 px-4 text-center">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Our Team
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Meet the people building co2ounter.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black font-sans">
      {/* Top Navigation */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Image src="/happy.png" alt="Happy Cat" width={40} height={40} />
          <h1 className="text-xl font-bold text-black dark:text-white">
            co2ounter
          </h1>
        </div>
        <nav className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveSection("home")}
            className="text-black dark:text-white hover:underline"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("docs")}
            className="text-black dark:text-white hover:underline"
          >
            Docs
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("team")}
            className="text-black dark:text-white hover:underline"
          >
            Team
          </button>
        </nav>
      </header>

      {/* Main Content */}
      {renderContent()}
    </div>
  );
}
