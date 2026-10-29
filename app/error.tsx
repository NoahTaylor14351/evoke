"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page-intro container">
      <span className="eyebrow">A QUICK TIMEOUT</span>
      <h1>
        LET'S TRY
        <br />
        THAT AGAIN.
      </h1>
      <p>This page couldn't be loaded. Please try again in a moment.</p>
      <button className="button" onClick={reset}>
        Try again ↗
      </button>
    </main>
  );
}
