import React from "react";

// Promotions component – renders a simple promotional banner section.
// Uses the project's design system (glassmorphism cards) for a premium look.
export const Promotions: React.FC = () => {
  return (
    <section className="a-card" style={{ marginBottom: "2rem" }}>
      <h2 style={{ color: "var(--a-text-bright)", marginBottom: "1rem" }}>
        Promotions
      </h2>
      <div
        style={{
          background: "linear-gradient(135deg, var(--a-accent), var(--a-accent2))",
          borderRadius: "var(--a-radius)",
          padding: "1rem",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: "1.1rem" }}>
          🎉 Check out our latest deals and offers! Stay tuned for exclusive discounts.
        </p>
      </div>
    </section>
  );
};
