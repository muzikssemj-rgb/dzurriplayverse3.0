"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Rekod paparan halaman tanpa kuki atau data peribadi.
 * Penanda "hari terakhir dilawati" disimpan dalam localStorage peranti ini sahaja
 * untuk menganggar pelawat unik harian.
 */
function malaysiaDay() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(new Date());
}

export function Analytics() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith("/admin")) return;
    let firstToday = true;
    let isNew = true;
    try {
      const today = malaysiaDay();
      isNew = !localStorage.getItem("dz:visited");
      firstToday = localStorage.getItem("dz:day") !== today;
      localStorage.setItem("dz:visited", "1");
      localStorage.setItem("dz:day", today);
    } catch {
      /* storan disekat — kira sebagai lawatan biasa */
    }
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, standalone: Boolean(standalone), firstToday, isNew }),
      keepalive: true,
    }).catch(() => {});
  }, [path]);
  return null;
}
