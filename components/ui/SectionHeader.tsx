import Link from "next/link";

export function SectionHeader({
  title,
  icon,
  href,
  linkLabel = "Lihat semua",
  id,
}: {
  title: string;
  icon?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 id={id} className="flex items-center gap-2 text-lg font-bold sm:text-xl">
        {icon && <span aria-hidden="true">{icon}</span>}
        {title}
      </h2>
      {href && (
        <Link href={href} className="shrink-0 rounded-lg px-2 py-1 text-sm text-white/75 hover:text-cyan-electric">
          {linkLabel} <span aria-hidden="true">›</span>
        </Link>
      )}
    </div>
  );
}
