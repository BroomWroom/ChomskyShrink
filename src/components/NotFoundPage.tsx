import React from "react";
import { AlertCircle, Home, Cpu } from "lucide-react";
import { ChomskyLogo } from "./ui/ChomskyLogo";

interface NotFoundPageProps {
  onNavigateHome: () => void;
  onNavigateConverter: () => void;
  isDark?: boolean;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome,
  onNavigateConverter,
  isDark = true,
}) => {
  const surfaceBg = isDark ? "#1a1007" : "#FFFFFF";
  const borderColor = isDark ? "#40372e" : "#DCD6F7";
  const textColor = isDark ? "#ffedd7" : "#424874";
  const mutedText = isDark ? "#a69888" : "#5f6594";
  const dimText = isDark ? "#6c5f51" : "#8b92be";

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-6 text-center" style={{ color: textColor }}>
      <div 
        className="flex flex-col items-center gap-6 max-w-md rounded-[12px] border p-8 shadow-2xl"
        style={{ backgroundColor: surfaceBg, borderColor }}
      >
        
        <div className="flex items-center justify-center p-4">
          <ChomskyLogo size={56} isDark={isDark} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-mono text-3xl font-bold" style={{ color: textColor }}>404 // DEAD STATE</div>
          <h2 className="text-sm font-medium uppercase tracking-wider" style={{ color: mutedText }}>
            TRANSITION ROUTE NOT FOUND
          </h2>
          <p className="text-xs leading-relaxed mt-1" style={{ color: dimText }}>
            The requested state computational sequence δ(q, w) does not exist in this automaton.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <button
            onClick={onNavigateHome}
            className="flex-1 flex items-center justify-center gap-2 rounded-[22.5px] border py-2.5 text-xs font-medium uppercase transition-all cursor-pointer"
            style={{
              backgroundColor: isDark ? "#100904" : "#F4EEFF",
              borderColor,
              color: textColor,
            }}
          >
            <Home className="h-4 w-4" />
            <span>HOME</span>
          </button>

          <button
            onClick={onNavigateConverter}
            className="flex-1 flex items-center justify-center gap-2 rounded-[36px] py-2.5 text-xs font-medium uppercase transition-all cursor-pointer border"
            style={{
              backgroundColor: isDark ? "#382416" : "#424874",
              borderColor: isDark ? "#40372e" : "#424874",
              color: isDark ? "#ffedd7" : "#F4EEFF",
            }}
          >
            <Cpu className="h-4 w-4" />
            <span>STUDIO</span>
          </button>
        </div>

      </div>
    </div>
  );
};
