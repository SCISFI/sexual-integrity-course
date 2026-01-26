import { useLocation } from "wouter";

export default function TherapistClient() {
  const [, setLocation] = useLocation();

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Client Detail</h1>

      <button
        onClick={() => setLocation("/therapist-home")}
        style={{
          marginBottom: 24,
          padding: "8px 14px",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "#f5f5f5",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Back to Therapist Home
      </button>

      <section style={{ marginTop: 24 }}>
        <h2>Progress</h2>
        {["Submitted", "Submitted", "Not submitted"].map((status, index) => (
          <div key={index} style={{ marginBottom: 8 }}>
            Week {index + 1} - {status}
            {index === 2 && (
              <span style={{ marginLeft: 8, fontStyle: "italic" }}>
                (Needs attention)
              </span>
            )}
          </div>
        ))}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Therapist Notes</h2>
        <div style={{ fontStyle: "italic" }}>
          Private notes (not visible to client).
        </div>
        <div style={{ marginTop: 8 }}>
          Initial resistance noted. Monitor avoidance and isolation patterns.
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Flags</h2>
        <div>Missed reflection in Week 3</div>
      </section>
    </div>
  );
}
