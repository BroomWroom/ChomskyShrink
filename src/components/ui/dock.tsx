import React, { createContext, useContext, useRef, useState } from 'react';
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DockProps {
  className?: string;
  children: React.ReactNode;
  magnification?: number;
  distance?: number;
  panelHeight?: number;
  style?: React.CSSProperties;
}

export interface DockItemProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export interface DockLabelProps {
  className?: string;
  children: React.ReactNode;
}

export interface DockIconProps {
  className?: string;
  children: React.ReactNode;
}

interface DockContextType {
  mouseX: MotionValue<number>;
  magnification: number;
  distance: number;
}

const DockContext = createContext<DockContextType | undefined>(undefined);

const DEFAULT_MAGNIFICATION = 66;
const DEFAULT_DISTANCE = 110;
const DEFAULT_PANEL_HEIGHT = 56;

export function Dock({
  className,
  children,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
  style,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="mx-2 flex max-w-full items-end overflow-visible">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          'mx-auto flex w-fit items-end gap-3 rounded-2xl border px-3 pb-2 shadow-2xl backdrop-blur-md',
          'bg-[var(--bg-surface)] border-[var(--border-cork)]',
          className
        )}
        style={{ height: panelHeight, ...style }}
        role="toolbar"
        aria-label="Application dock"
      >
        <DockContext.Provider value={{ mouseX, magnification, distance }}>
          {children}
        </DockContext.Provider>
      </motion.div>
    </div>
  );
}

export function DockItem({ className, children, onClick, style }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const context = useContext(DockContext);
  const [isHovered, setIsHovered] = useState(false);

  const defaultMouseX = useMotionValue(Infinity);
  const mouseX = context?.mouseX ?? defaultMouseX;
  const magnification = context?.magnification ?? DEFAULT_MAGNIFICATION;
  const distance = context?.distance ?? DEFAULT_DISTANCE;

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distanceCalc, [-distance, 0, distance], [40, magnification, 40]);
  const size = useSpring(widthSync, { mass: 0.1, stiffness: 280, damping: 18 });

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size, ...style }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full cursor-pointer select-none origin-bottom will-change-transform shadow-md',
        className
      )}
      tabIndex={0}
      role="button"
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.9 }}
            animate={{ opacity: 1, y: -8, scale: 1 }}
            exit={{ opacity: 0, y: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-30"
          >
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && (child.type === DockLabel || (child.props as any)?.['data-dock-label'])) {
                return child;
              }
              return null;
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-full w-full items-center justify-center p-2 pointer-events-none">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type !== DockLabel) {
            return child;
          }
          return null;
        })}
      </div>
    </motion.div>
  );
}

export function DockLabel({ children, className }: DockLabelProps) {
  return (
    <div
      className={cn(
        'whitespace-pre rounded-md border border-[var(--border-cork)] bg-[var(--bg-main)] px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase text-[var(--text-cream)] shadow-xl backdrop-blur-md',
        className
      )}
      role="tooltip"
    >
      {children}
    </div>
  );
}

export function DockIcon({ children, className }: DockIconProps) {
  return (
    <div className={cn('flex h-full w-full items-center justify-center', className)}>
      {children}
    </div>
  );
}
