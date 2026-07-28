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
          background: "linear-gradient(135deg, #071845 0%, #0d2b6b 100%)",
          borderRadius: "var(--a-radius)",
          padding: "1.25rem 1rem",
          color: "#ffffff",
          textAlign: "center",
          boxShadow: "0 6px 18px rgba(7, 24, 69, 0.15)"
        }}
      >
        <p style={{ margin: 0, fontSize: "1.1rem" }}>
          🎉 Check out our latest deals and offers! Stay tuned for exclusive discounts.
        </p>
      </div>
    </section>
  );
};
