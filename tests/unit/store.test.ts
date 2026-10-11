import { describe, expect, it } from "vitest";
import { filterGames } from "@/lib/data/store";
import type { Game } from "@/lib/types";

const g = (o: Partial<Game>): Game => ({
  id: o.slug ?? "x", title: "T", slug: "t", description: "", full_description: "", game_url: "https://e.com",
  thumbnail_url: null, category_id: null, tags: [], difficulty: null, target_age: null, launch_mode: "embedded",
  is_featured: false, status: "published", display_order: 0, play_count: 0, published_at: null,
  created_at: "2026-01-01", updated_at: "2026-01-01", category: null, ...o,
});

describe("filterGames", () => {
  const all = [
    g({ slug: "a", title: "Alpha", display_order: 2, play_count: 5, tags: ["muzik"], category_id: "c1", is_featured: true, published_at: "2026-02-01" }),
    g({ slug: "b", title: "Beta", display_order: 1, play_count: 9, published_at: "2026-03-01" }),
    g({ slug: "d", title: "Draft", status: "draft" }),
    g({ slug: "u", title: "Hidden", status: "unpublished" }),
  ];
  it("only published, ordered", () => expect(filterGames(all, {}).map((x) => x.slug)).toEqual(["b", "a"]));
  it("search title/tag", () => {
    expect(filterGames(all, { q: "alp" }).map((x) => x.slug)).toEqual(["a"]);
    expect(filterGames(all, { q: "muzik" }).map((x) => x.slug)).toEqual(["a"]);
    expect(filterGames(all, { q: "draft" })).toHaveLength(0);
  });
  it("category, tag, featured", () => {
    expect(filterGames(all, { categoryId: "c1" })).toHaveLength(1);
    expect(filterGames(all, { tag: "muzik" })).toHaveLength(1);
    expect(filterGames(all, { featured: true })).toHaveLength(1);
  });
  it("sorts popular and recent", () => {
    expect(filterGames(all, { sort: "popular" })[0].slug).toBe("b");
    expect(filterGames(all, { sort: "recent" })[0].slug).toBe("b");
  });
});
