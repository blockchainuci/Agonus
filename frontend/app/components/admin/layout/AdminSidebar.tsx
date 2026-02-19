"use client";

import Link from "next/link";
import { Trophy, Users, ArrowLeft, Plus, Bot } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const navItems = [
  {
    label: "Tournaments",
    sectionId: "tournaments-section",
    icon: Trophy,
  },
  {
    label: "Agents",
    sectionId: "agents-section",
    icon: Users,
  },
];

interface AdminSidebarProps {
  onCreateTournament?: () => void;
  onCreateAgent?: () => void;
}

export default function AdminSidebar({ onCreateTournament, onCreateAgent }: AdminSidebarProps) {
  const [activeSection, setActiveSection] = useState("agents-section");
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => document.getElementById(item.sectionId));

      for (const section of sections) {
        if (section) {
          const rect = section.getBoundingClientRect();
          // Check if section is in viewport (top half of screen)
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCreateMenu(false);
      }
    };

    if (showCreateMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCreateMenu]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="w-64 bg-slate-900/80 backdrop-blur-sm border-r border-white/10 sticky top-0 h-screen flex flex-col p-6">
      {/* Logo/Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Agonus</h1>
        <p className="text-sm text-gray-400">Admin Console</p>
      </div>

      {/* Create Button with Dropdown */}
      <div className="mb-6 relative" ref={menuRef}>
        <button
          onClick={() => setShowCreateMenu(!showCreateMenu)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create New</span>
        </button>

        {/* Dropdown Menu */}
        {showCreateMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/20 rounded-lg shadow-xl overflow-hidden z-50">
            <button
              onClick={() => {
                onCreateTournament?.();
                setShowCreateMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-blue-500/20 transition-colors border-b border-white/10"
            >
              <Trophy className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-medium">Tournament</div>
                <div className="text-xs text-gray-400">Create a new tournament</div>
              </div>
            </button>
            <button
              onClick={() => {
                onCreateAgent?.();
                setShowCreateMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-purple-500/20 transition-colors"
            >
              <Bot className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-medium">Agent</div>
                <div className="text-xs text-gray-400">Create a new AI agent</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Navigation - Scroll to sections */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.sectionId;

          return (
            <button
              key={item.sectionId}
              onClick={() => scrollToSection(item.sectionId)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Back to Main Site */}
      <div className="pt-8 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Main Site</span>
        </Link>
      </div>
    </aside>
  );
}
