import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page-intro container">
      <span className="eyebrow">404 / OUT OF BOUNDS</span>
      <h1>
        BACK TO
        <br />
        THE GAME.
      </h1>
      <p>That page isn't here. Find your way back to Evoke.</p>
      <Link className="button" href="/">
        Return home ↗
      </Link>
    </main>
  );
}
