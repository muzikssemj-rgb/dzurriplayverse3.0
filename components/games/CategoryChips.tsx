import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryChips({ categories, active }: { categories: Category[]; active?: string | null }) {
  return (
    <nav aria-label="Game categories">
      <ul className="scrollbar-none -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <li>
          <Link href="/games" className={`chip ${!active ? "chip-active" : ""}`} aria-current={!active ? "page" : undefined}>
            <span aria-hidden="true">🎮</span> All Games
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/games?category=${c.slug}`}
              className={`chip ${active === c.slug ? "chip-active" : ""}`}
              aria-current={active === c.slug ? "page" : undefined}
            >
              {c.icon && <span aria-hidden="true">{c.icon}</span>}
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
