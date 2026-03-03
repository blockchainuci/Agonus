"use client";

import { Trophy, Users, ArrowLeft, Plus, Bot, Shield } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const navItems = [
  {
    label: "Tournaments",
    sectionId: "tournaments-section",
    icon: Trophy,
  },
  {
    label: "Agents DB",
    sectionId: "agents-section",
    icon: Users,
  },
];

interface AdminSidebarProps {
  onCreateTournament?: () => void;
  onCreateAgent?: () => void;
}

export default function AdminSidebar({
  onCreateTournament,
  onCreateAgent,
}: AdminSidebarProps) {
  const [activeSection, setActiveSection] = useState("tournaments-section");
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // We monitor the user's scroll position to highlight the correct section in the sidebar.
  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) =>
        document.getElementById(item.sectionId),
      );

      for (const section of sections) {
        if (section) {
          const rect = section.getBoundingClientRect();
          // If the section is within the top portion of the viewport, mark it as active.
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

  // This ensures that if the user clicks anywhere outside the create menu, it closes smoothly.
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
    <aside
      className="w-64 border-r border-white/5 sticky top-0 h-screen flex flex-col p-6 z-40 shrink-0"
      style={{ background: "#0c1422" }}
    >
      {/* Brand Header */}
      <div className="mb-10 pt-2 px-2">
        <a
          href="/"
          className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Agonus</h1>
            <p className="text-[9px] font-bold text-cyan-500 uppercase tracking-[0.2em] mt-0.5">
              Admin Console
            </p>
          </div>
        </a>
      </div>

      {/* Primary Action Button */}
      <div className="mb-8 relative px-2" ref={menuRef}>
        <button
          onClick={() => setShowCreateMenu(!showCreateMenu)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-black font-bold rounded-xl transition-all hover:scale-[0.98] shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]"
          style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
        >
          <Plus className="w-5 h-5" />
          <span>Create New</span>
        </button>

        {/* Dropdown Menu */}
        {showCreateMenu && (
          <div className="absolute top-full left-2 right-2 mt-3 bg-[#121c2d] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1">
            <button
              onClick={() => {
                onCreateTournament?.();
                setShowCreateMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-bold">Tournament</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Initialize a new event
                </div>
              </div>
            </button>

            <div className="h-px w-full bg-white/5" />

            <button
              onClick={() => {
                onCreateAgent?.();
                setShowCreateMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-bold">AI Agent</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Deploy a new trader
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-2">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 px-2">
          Database Views
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.sectionId;

          return (
            <button
              key={item.sectionId}
              onClick={() => scrollToSection(item.sectionId)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200 text-sm font-semibold
                ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-white/5 px-4">
        <a
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Exit to Terminal
        </a>
      </div>
    </aside>
  );
}
