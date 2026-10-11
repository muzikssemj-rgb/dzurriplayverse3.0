"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#0B1020", color: "#fff", fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1>DZURRI PLAYVERSE</h1>
          <p>Something went wrong. Please reload.</p>
          <button onClick={() => reset()} style={{ padding: "12px 20px", borderRadius: 12, border: 0, background: "#22D3EE", fontWeight: 700 }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
