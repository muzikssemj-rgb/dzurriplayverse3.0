import { describe, expect, it } from "vitest";
import { dayKey, deviceFromUA, lastDays, pageKeyFromPath, summarize, type DailyStats } from "@/lib/data/analytics";

const day = (date: string, o: Partial<DailyStats> = {}): DailyStats => ({
  date, views: 0, visitors: 0, plays: 0, app_views: 0, app_visitors: 0, new_visitors: 0, returning_visitors: 0,
  hours: {}, pages: {}, devices: {}, games: {}, ...o,
});

describe("analytics helpers", () => {
  it("maps paths to page keys", () => {
    expect(pageKeyFromPath("/")).toBe("home");
    expect(pageKeyFromPath("/games")).toBe("games");
    expect(pageKeyFromPath("/games/music-quest")).toBe("game");
    expect(pageKeyFromPath("/creator")).toBe("creator");
    expect(pageKeyFromPath("/weird/thing")).toBe("other");
  });
  it("detects device", () => {
    expect(deviceFromUA("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148")).toBe("mobile");
    expect(deviceFromUA("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tablet");
    expect(deviceFromUA("Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Safari/537.36")).toBe("tablet");
    expect(deviceFromUA("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36")).toBe("mobile");
    expect(deviceFromUA("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/140")).toBe("desktop");
  });
  it("uses Malaysia day boundaries", () => {
    expect(dayKey(new Date("2026-10-11T16:30:00Z"))).toBe("2026-10-12"); // 00:30 MYT
    expect(lastDays(3, new Date("2026-10-12T04:00:00Z"))).toEqual(["2026-10-10", "2026-10-11", "2026-10-12"]);
  });
  it("summarizes trends, peak hour and engagement", () => {
    const rows: DailyStats[] = [];
    for (let i = 0; i < 60; i++) rows.push(day(`d${String(i).padStart(2, "0")}`));
    rows[50] = day("d50", { visitors: 10, plays: 5 }); // minggu lepas
    rows[55] = day("d55", { visitors: 12, views: 30, plays: 30, hours: { h20: 25, h09: 5 }, devices: { mobile: 9, desktop: 3 }, games: { g1: 20, g2: 10 }, new_visitors: 8, returning_visitors: 4, app_visitors: 6 });
    rows[59] = day("d59", { visitors: 3, views: 4, plays: 1 });
    const s = summarize(rows);
    expect(s.today).toEqual({ visitors: 3, views: 4, plays: 1 });
    expect(s.week.visitors).toBe(15);
    expect(s.week.visitorsChange).toBe(50);
    expect(s.week.playsChange).toBe(520);
    expect(s.peakHour).toBe(20);
    expect(s.month.visitors).toBe(25);
    expect(s.month.activeDays).toBe(3);
    expect(s.month.playsPerVisitor).toBe(1.4);
    expect(s.devices).toEqual({ mobile: 9, desktop: 3 });
    expect(s.daily).toHaveLength(30);
  });
  it("handles no data", () => {
    const s = summarize(Array.from({ length: 60 }, (_, i) => day(`x${i}`)));
    expect(s.peakHour).toBeNull();
    expect(s.week.visitorsChange).toBe(0);
    expect(s.month.playsPerVisitor).toBe(0);
  });
});
