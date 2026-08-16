import React from "react";
import { Moon, Sun } from "lucide-react";
import { ChomskyLogo } from "./ui/ChomskyLogo";

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isDark,
  onToggleTheme,
}) => {
  const navItems = [
    { id: "landing", label: "HOME" },
    { id: "converter", label: "STUDIO" },
    { id: "lessons", label: "LESSONS" },
    { id: "practice", label: "ARENA" },
  ];

  const primaryBg = isDark ? "rgba(16, 9, 4, 0.95)" : "rgba(244, 238, 255, 0.95)";
  const borderColor = isDark ? "#40372e" : "#DCD6F7";
  const textColor = isDark ? "#ffedd7" : "#424874";
  const mutedText = isDark ? "#a69888" : "#5f6594";

  return (
    <header 
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md px-6 py-3.5 transition-colors duration-200"
      style={{ backgroundColor: primaryBg, borderColor }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Wordmark Logo (Only element on the left) */}
        <div 
          onClick={() => onSelectTab("landing")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <ChomskyLogo size={30} isDark={isDark} />
          <div className="flex flex-col">
            <span className="font-medium tracking-widest text-xs uppercase" style={{ color: textColor }}>
              CHOMSKY
            </span>
            <span className="text-[8px] font-mono tracking-wider uppercase opacity-60" style={{ color: mutedText }}>
              STUDIO 1-MODEL
            </span>
          </div>
        </div>

        {/* Navigation Items & Theme Toggle (Right aligned) */}
        <div className="flex items-center gap-6 sm:gap-8">
          <nav className="flex items-center gap-4 sm:gap-7">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className="text-xs font-medium uppercase transition-all cursor-pointer"
                  style={{
                    color: isActive ? textColor : mutedText,
                    borderBottom: isActive ? `1px dashed ${textColor}` : "1px dashed transparent",
                    paddingBottom: "2px",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="flex h-8 w-8 items-center justify-center rounded-[22.5px] border transition-all cursor-pointer"
            style={{
              backgroundColor: isDark ? "#1a1007" : "#FFFFFF",
              borderColor,
              color: textColor,
            }}
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>

      </div>
    </header>
  );
};
