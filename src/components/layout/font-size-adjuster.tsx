/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability */
"use client";

import { useEffect, useState } from "react";
import { Type, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";
import type { FontSizePreference } from "@/features/identity";

const SIZES: { id: FontSizePreference; label: string; scale: string }[] = [
  { id: "small", label: "เล็ก (Small)", scale: "90%" },
  { id: "normal", label: "ปกติ (Default)", scale: "100%" },
  { id: "medium", label: "ปานกลาง (Medium)", scale: "110%" },
  { id: "large", label: "ใหญ่ (Large)", scale: "120%" },
  { id: "xlarge", label: "ใหญ่พิเศษ (XL)", scale: "130%" },
];

export function FontSizeAdjuster({ className }: { className?: string }) {
  const [currentSize, setCurrentSize] = useState<FontSizePreference>("normal");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved =
      (localStorage.getItem("vibe_font_size") as FontSizePreference) ||
      (document.documentElement.getAttribute("data-font-size") as FontSizePreference) ||
      "normal";
    if (SIZES.some((s) => s.id === saved)) {
      setCurrentSize(saved);
      document.documentElement.setAttribute("data-font-size", saved);
    }
  }, []);

  const changeSize = (size: FontSizePreference) => {
    setCurrentSize(size);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-font-size", size);
      try {
        localStorage.setItem("vibe_font_size", size);
        document.cookie = `vibe_font_size=${size};path=/;max-age=31536000;SameSite=Lax`;
      } catch {}
    }
  };

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 text-muted-foreground", className)}
        aria-label="Font Size"
      >
        <Type className="h-4 w-4" />
      </Button>
    );
  }

  const currentScale = SIZES.find((s) => s.id === currentSize)?.scale ?? "100%";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors",
            currentSize !== "normal" && "text-primary font-bold",
            className
          )}
          title={`ขนาดตัวอักษร: ${currentScale}`}
          aria-label="ปรับขนาดตัวอักษร (Adjust Font Size)"
        >
          <Type className="h-3.5 w-3.5" />
          <span className="text-[11px] font-mono">{currentScale}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          ขนาดตัวอักษร (Font Size)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SIZES.map((s) => {
          const isSelected = currentSize === s.id;
          return (
            <DropdownMenuItem
              key={s.id}
              onClick={() => changeSize(s.id)}
              className={cn(
                "flex items-center justify-between text-xs py-2 cursor-pointer",
                isSelected && "bg-primary/10 text-primary font-semibold"
              )}
            >
              <div className="flex items-center gap-2">
                <span>{s.label}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <span>{s.scale}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-1" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
