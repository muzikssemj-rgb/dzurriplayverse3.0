/** Data awal — dimasukkan secara automatik kali pertama aplikasi membaca pangkalan data kosong. */
export const SEED_CATEGORIES = [
  { slug: "music-world", name: "Dunia Muzik", description: "Rentak, irama dan teori muzik.", icon: "🎵", image_url: "/images/worlds/music-world.webp", display_order: 10 },
  { slug: "adventure-world", name: "Dunia Pengembaraan", description: "Teroka dunia dan selesaikan misi.", icon: "🚀", image_url: "/images/worlds/adventure-world.webp", display_order: 20 },
  { slug: "quiz-world", name: "Dunia Kuiz", description: "Uji pengetahuan dan cabar minda.", icon: "🧠", image_url: "/images/worlds/quiz-world.webp", display_order: 30 },
  { slug: "arcade-world", name: "Dunia Arked", description: "Aksi pantas, refleks dan skor tinggi.", icon: "🕹️", image_url: "/images/worlds/arcade-world.webp", display_order: 40 },
  { slug: "puzzle-world", name: "Dunia Teka-teki", description: "Teka-teki, logik dan ingatan.", icon: "🧩", image_url: null, display_order: 50 },
  { slug: "ar-vr-world", name: "Dunia AR & VR", description: "Pengalaman realiti terimbuh dan maya.", icon: "🥽", image_url: null, display_order: 60 },
  { slug: "educational-games", name: "Permainan Pendidikan", description: "Permainan pembelajaran untuk bilik darjah.", icon: "🎓", image_url: null, display_order: 70 },
  { slug: "other-games", name: "Permainan Lain", description: "Permainan lain dalam Playverse.", icon: "✨", image_url: null, display_order: 80 },
] as const;

export const SEED_GAMES = [
  {
    slug: "music-quest", title: "Music Quest", category: "music-world", difficulty: "easy", target_age: "7+", is_featured: true, display_order: 10,
    description: "Dengar nada dan teka nama not Do-Re-Mi.",
    full_description: "Music Quest melatih telinga muzik anda. Setiap pusingan memainkan satu nada dan memaparkannya pada baluk. Pilih nama not yang betul (Do, Re, Mi, Fa, So, La, Ti). 10 pusingan setiap permainan.",
    game_url: "/play/music-quest/index.html", thumbnail_url: "/images/games/music-quest.webp", tags: ["muzik", "nota", "irama"],
  },
  {
    slug: "rhythm-runner", title: "Rhythm Runner", category: "arcade-world", difficulty: "medium", target_age: "8+", is_featured: true, display_order: 20,
    description: "Lompat mengikut rentak dan elak halangan.",
    full_description: "Rhythm Runner menguji refleks dan rasa rentak. Halangan muncul mengikut ketukan muzik — tekan Space, klik atau sentuh skrin untuk melompat.",
    game_url: "/play/rhythm-runner/index.html", thumbnail_url: "/images/games/rhythm-runner.webp", tags: ["irama", "refleks", "kelajuan"],
  },
  {
    slug: "quiz-arena", title: "Quiz Arena", category: "quiz-world", difficulty: "medium", target_age: "9+", is_featured: true, display_order: 30,
    description: "Kuiz pengetahuan am dengan pemasa.",
    full_description: "Quiz Arena mengandungi soalan pengetahuan am, sains, matematik dan geografi. Jawab 10 soalan rawak; jawapan pantas memberi bonus markah.",
    game_url: "/play/quiz-arena/index.html", thumbnail_url: "/images/games/quiz-arena.webp", tags: ["kuiz", "pengetahuan", "cabaran"],
  },
  {
    slug: "memory-match", title: "Memory Match", category: "puzzle-world", difficulty: "easy", target_age: "6+", is_featured: false, display_order: 40,
    description: "Padankan pasangan kad secepat mungkin.",
    full_description: "Memory Match melatih daya ingatan. Terbalikkan dua kad pada satu masa dan cari semua pasangan dengan langkah paling sedikit.",
    game_url: "/play/memory-match/index.html", thumbnail_url: "/images/games/memory-match.webp", tags: ["ingatan", "teka-teki", "logik"],
  },
] as const;
