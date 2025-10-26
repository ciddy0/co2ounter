"use client";
import Image from "next/image";
import { useState } from "react";
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const [activeSection, setActiveSection] = useState("home"); // home, team
  const { setTheme } = useTheme();

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return (
          <div className="flex flex-col items-center justify-center flex-1 px-4 text-center space-y-6">
            <h1 className="text-3xl mb-0 font-bold text-black dark:text-white">
              co2ounter
            </h1>
            <h2 className="text-xl font-semibold text-[#BC9E9E]">
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
      case "team":
        return (
          <div className="flex flex-col items-center justify-center flex-1 px-4 text-center space-y-6">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Our Team
            </h1>

            <div className="grid grid-cols-2 gap-6 mt-6">
              {/* Team Member Template */}
              {[
                {
                  name: "Diego Cid",
                  linkedin: "https://www.linkedin.com/in/diego-cid02",
                },
                {
                  name: "Sophia Ngo",
                  linkedin: "https://www.linkedin.com/in/sophia-ngo-166a91358/",
                },
                {
                  name: "Zophia Laud",
                  linkedin: "https://www.linkedin.com/in/zophia-laud/",
                },
                {
                  name: "Angie Tran",
                  linkedin: "https://www.linkedin.com/in/angiextran",
                },
              ].map((member) => (
                <div
                  key={member.name}
                  className="flex flex-col items-center p-4 border rounded-lg shadow hover:shadow-lg transition bg-white dark:bg-gray-800"
                >
                  {/* Profile Icon */}
                  <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>

                  {/* Name */}
                  <h2 className="text-xl font-semibold text-black dark:text-white">
                    {member.name}
                  </h2>

                  {/* LinkedIn */}
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mt-2"
                  >
                    LinkedIn
                  </a>
                </div>
              ))}
            </div>
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
          <Image src="/happy.png" alt="Happy Cat" width={50} height={50} />
          {/* <h1 className="text-xl font-bold text-black dark:text-white">
            co2ounter
          </h1> */}
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
            onClick={() => setActiveSection("team")}
            className="text-black dark:text-white hover:underline"
          >
            Team
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </header>

      {/* Main Content */}
      {renderContent()}
    </div>
  );
}
