import Link from "next/link";
import { PageIntro } from "./presentation";
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <PageIntro eyebrow="EVOKE ESPORTS / INFORMATION" title={title}>
        {intro}
      </PageIntro>
      <article className="section container prose">
        {children}
        <h2>Questions?</h2>
        <p>
          <Link className="text-link" href="/contact">
            Contact Evoke ↗
          </Link>
        </p>
      </article>
    </main>
  );
}
