import React, { useState, useRef, useEffect } from "react";

interface InfoTooltipProps {
  title?: string;
  explanation: string;
  align?: "left" | "center" | "right";
  position?: "top" | "bottom";
  className?: string;
}

export default function InfoTooltip({
  title,
  explanation,
  align = "center",
  position = "top",
  className = "",
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const getAlignClasses = () => {
    switch (align) {
      case "left":
        return "left-0 translate-x-0";
      case "right":
        return "right-0 translate-x-0";
      case "center":
      default:
        return "left-1/2 -translate-x-1/2";
    }
  };

  const getPositionClasses = () => {
    if (position === "bottom") {
      return "top-full mt-2";
    }
    return "bottom-full mb-2";
  };

  const getArrowClasses = () => {
    if (position === "bottom") {
      return "bottom-full left-1/2 -translate-x-1/2 -mb-px border-4 border-transparent border-b-zinc-700";
    }
    return "top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-zinc-700";
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center group font-sans ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="w-4 h-4 rounded-full border border-zinc-700/80 bg-zinc-900 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/60 focus:border-emerald-500 flex items-center justify-center text-[10px] font-bold font-mono transition-all duration-150 cursor-help focus:outline-none shadow-sm"
        aria-label={title ? `Learn more about ${title}` : "What does this section mean?"}
        title="Plain English explanation"
      >
        i
      </button>

      {/* Floating Info Popover */}
      <div
        className={`absolute ${getAlignClasses()} ${getPositionClasses()} ${
          isOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95"
        } transition-all duration-200 ease-out z-[999] pointer-events-auto`}
        role="tooltip"
      >
        <div className="w-72 sm:w-80 p-3.5 bg-zinc-950/95 backdrop-blur-md border border-zinc-700/90 rounded-xl shadow-2xl text-left space-y-1.5">
          {/* Subtle arrow */}
          <div className={`absolute ${getArrowClasses()}`} />

          {/* Header pill */}
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 tracking-wider uppercase font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Plain English Guide</span>
            </div>
            <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest">
              SOC Help
            </span>
          </div>

          {/* Title */}
          {title && (
            <div className="text-xs font-bold text-zinc-100 tracking-tight">
              {title}
            </div>
          )}

          {/* Human Explanation */}
          <p className="text-[11px] leading-relaxed text-zinc-300 font-normal normal-case font-sans">
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
