import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./components/LandingPage";
import { ConverterApp } from "./components/ConverterApp";
import { LessonsHub } from "./components/LessonsHub";
import { PracticeGym } from "./components/PracticeGym";
import { NotFoundPage } from "./components/NotFoundPage";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("landing");
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | undefined>(undefined);
  
  // Persisted theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("chomsky_theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    localStorage.setItem("chomsky_theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#100904";
      document.body.style.color = "#ffedd7";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.body.style.backgroundColor = "#F4EEFF";
      document.body.style.color = "#424874";
    }
  }, [isDark]);

  const handleNavigate = (tab: string, practiceId?: string) => {
    if (practiceId) {
      setSelectedPracticeId(practiceId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`min-h-screen w-full flex flex-col antialiased transition-colors duration-300 ${
      isDark ? "bg-[#100904] text-[#ffedd7]" : "bg-[#F4EEFF] text-[#424874]"
    }`}>
      {/* Global Navbar */}
      <Navbar
        activeTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />

      {/* Main Content Router View */}
      <main className="flex-1 w-full flex flex-col">
        {currentTab === "landing" && (
          <LandingPage onNavigate={(tab) => handleNavigate(tab)} isDark={isDark} />
        )}

        {currentTab === "converter" && (
          <div className="py-4">
            <ConverterApp isDark={isDark} />
          </div>
        )}

        {currentTab === "lessons" && (
          <div className="py-4">
            <LessonsHub
              onOpenStudio={() => handleNavigate("converter")}
              onOpenPractice={(practiceId) => handleNavigate("practice", practiceId)}
              isDark={isDark}
            />
          </div>
        )}

        {currentTab === "practice" && (
          <div className="py-4">
            <PracticeGym
              initialChallengeId={selectedPracticeId}
              onOpenLessons={() => handleNavigate("lessons")}
              isDark={isDark}
            />
          </div>
        )}

        {currentTab === "theory" && (
          <div className="py-4">
            <LessonsHub
              onOpenStudio={() => handleNavigate("converter")}
              onOpenPractice={(practiceId) => handleNavigate("practice", practiceId)}
              isDark={isDark}
            />
          </div>
        )}

        {!["landing", "converter", "lessons", "practice", "theory"].includes(currentTab) && (
          <NotFoundPage
            onNavigateHome={() => handleNavigate("landing")}
            onNavigateConverter={() => handleNavigate("converter")}
            isDark={isDark}
          />
        )}
      </main>
    </div>
  );
}
