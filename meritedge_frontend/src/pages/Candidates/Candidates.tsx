import React from "react";

export default function Candidates() {
  return (
    <div
      className="min-h-screen relative max-w-full overflow-x-hidden"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        padding: "24px",
        zIndex: 1,
      }}
    >
      <h1 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
        Candidates
      </h1>
      <p style={{ color: "var(--text-secondary)" }}>
        This page is under development.
      </p>
    </div>
  );
}

