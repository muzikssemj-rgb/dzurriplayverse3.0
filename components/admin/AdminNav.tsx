"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/games", label: "Games", icon: "🎮" },
  { href: "/admin/categories", label: "Categories", icon: "🗂️" },
  { href: "/admin/kit", label: "Kit Pembelajaran", icon: "🎬" },
  { href: "/admin/kuiz", label: "Kuiz Guru", icon: "📝" },
  { href: "/admin/profile", label: "Creator Profile", icon: "👤" },
  { href: "/admin/reports", label: "Reports", icon: "⚑" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin">
      <ul className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
        {ITEMS.map((i) => {
          const active = path === i.href || path.startsWith(i.href + "/");
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 text-sm font-medium ${
                  active ? "chip-active border" : "text-white/80 hover:bg-white/5"
                }`}
              >
                <span aria-hidden="true">{i.icon}</span>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
