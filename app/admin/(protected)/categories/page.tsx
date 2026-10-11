import type { Metadata } from "next";
import { listAdminCategories } from "@/lib/data/store";
import { deleteCategoryAction } from "@/lib/actions/categories";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Flash } from "@/components/admin/Flash";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage(props: PageProps<"/admin/categories">) {
  const sp = await props.searchParams;
  const categories = await listAdminCategories();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-black tracking-wide">Categories</h1>
        <p className="text-sm text-ink-muted">
          Categories appear as chips and Game Worlds on the home page. “All Games” is built-in and always shown first.
        </p>
      </header>
      <Flash msg={typeof sp.msg === "string" ? sp.msg : undefined} />

      <section className="glass neon-border p-4" aria-labelledby="add-cat">
        <h2 id="add-cat" className="mb-3 font-bold">Add category</h2>
        <CategoryForm />
      </section>

      <ul className="space-y-3">
        {categories.map((c) => (
          <li key={c.id} className="glass space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {c.icon} {c.name} <span className="text-xs font-normal text-ink-muted">· {c.game_count} game{c.game_count === 1 ? "" : "s"}</span>
              </p>
              <ConfirmSubmit
                action={deleteCategoryAction}
                fields={{ id: c.id }}
                label="Delete"
                title={`Delete category “${c.name}”?`}
                message={
                  c.game_count > 0
                    ? `${c.game_count} game(s) use this category. They will NOT be deleted — they will become “Uncategorized”.`
                    : "This category has no games. This cannot be undone."
                }
              />
            </div>
            <CategoryForm key={c.id} category={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}
