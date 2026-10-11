export type GameStatus = "draft" | "published" | "unpublished";
export type LaunchMode = "embedded" | "external";
export type Difficulty = "easy" | "medium" | "hard";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CategoryRef = Pick<Category, "id" | "name" | "slug" | "icon">;

export type Game = {
  id: string;
  title: string;
  slug: string;
  description: string;
  full_description: string;
  game_url: string;
  thumbnail_url: string | null;
  category_id: string | null;
  tags: string[];
  difficulty: Difficulty | null;
  target_age: string | null;
  launch_mode: LaunchMode;
  is_featured: boolean;
  status: GameStatus;
  display_order: number;
  play_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category?: CategoryRef | null;
};

/** Medan yang selamat dipaparkan kepada awam (kad & pelancar). */
export type PublicGame = Pick<
  Game,
  | "id"
  | "title"
  | "slug"
  | "description"
  | "full_description"
  | "game_url"
  | "thumbnail_url"
  | "category_id"
  | "tags"
  | "difficulty"
  | "target_age"
  | "launch_mode"
  | "is_featured"
  | "published_at"
  | "created_at"
> & { category: CategoryRef | null };

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const STATUS_LABEL: Record<GameStatus, string> = {
  draft: "Draft",
  published: "Published",
  unpublished: "Unpublished",
};

export type CreatorProfile = {
  name: string;
  title: string;
  bio: string;
  quote: string;
  photo_url: string | null;
  hero_url: string | null;
  updated_at: string | null;
};

export const DEFAULT_PROFILE: CreatorProfile = {
  name: "Dzurri",
  title: "Creator · Educator · Game Developer",
  bio:
    "Semua permainan dalam DZURRI PLAYVERSE dibangunkan, direka dan diterbitkan oleh Dzurri. Platform ini merupakan hasil visi untuk menggabungkan teknologi, kreativiti dan pembelajaran dalam satu dunia permainan digital.",
  quote: "Bermain hari ini, membina masa depan yang lebih cerah.",
  photo_url: null,
  hero_url: null,
  updated_at: null,
};

export const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
