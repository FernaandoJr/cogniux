import { useEffect, useState } from "react";
import { useIsDark } from "@/hooks/useIsDark";

export function usePrimaryHex() {
  const isDark = useIsDark();
  const [hex, setHex] = useState("#4f46e5");
  useEffect(() => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim();
    if (!raw) return;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = raw;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    setHex(`#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`);
  }, [isDark]);
  return hex;
}
