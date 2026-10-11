import Link from "next/link";
import type { Category } from "@/lib/types";

const GRADIENTS = [
  "from-violet-700 via-indigo-800 to-space",
  "from-emerald-600 via-teal-800 to-space",
  "from-fuchsia-700 via-purple-800 to-space",
  "from-amber-600 via-orange-800 to-space",
  "from-sky-600 via-blue-800 to-space",
  "from-cyan-600 via-sky-800 to-space",
];

export function WorldCard({ category, index }: { category: Category; index: number }) {
  const words = category.name.split(" ");
  const last = words.length > 1 ? words.pop() : null;
  return (
    <Link
      href={`/games?category=${category.slug}`}
      className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b p-3 text-center transition hover:-translate-y-1 hover:border-cyan-electric/50 ${GRADIENTS[index % GRADIENTS.length]}`}
    >
      {category.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={category.image_url}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-x-0 top-0 h-[68%] w-full object-cover transition duration-500 group-hover:scale-105"
          style={{ maskImage: "linear-gradient(to bottom, black 70%, transparent)" }}
        />
      ) : (
        <span className="absolute inset-x-0 top-[18%] text-5xl drop-shadow-[0_0_16px_rgba(34,211,238,.7)]" aria-hidden="true">
          {category.icon || "✨"}
        </span>
      )}
      <span className="relative font-display text-sm font-black uppercase leading-tight tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,.9)] sm:text-base">
        {words.join(" ")}
        {last && <span className="block text-[0.8em] font-bold text-white/90">{last}</span>}
      </span>
      <span
        className="relative mx-auto mt-2 grid size-8 place-items-center rounded-full border-2 border-gold/80 text-gold"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}
