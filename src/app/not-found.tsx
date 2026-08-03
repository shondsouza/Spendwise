import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-glow not-found-glow--blue" aria-hidden />
      <div className="not-found-glow not-found-glow--green" aria-hidden />
      <div className="not-found-glow not-found-glow--indigo" aria-hidden />

      <div className="not-found-orbit" aria-hidden>
        <span className="not-found-orbit__dot not-found-orbit__dot--1" />
        <span className="not-found-orbit__dot not-found-orbit__dot--2" />
        <span className="not-found-orbit__dot not-found-orbit__dot--3" />
      </div>

      <div className="not-found-content">
        <div className="not-found-brand">
          <Image
            src="/logo/login-logo.png"
            alt="SpendWise"
            width={44}
            height={44}
            className="not-found-brand__logo"
            priority
          />
          <span>SpendWise</span>
        </div>

        <div className="not-found-hero" aria-hidden>
          <span className="not-found-digit">4</span>
          <span className="not-found-zero">
            <span className="not-found-zero__ring" />
            <span className="not-found-zero__core" />
          </span>
          <span className="not-found-digit">4</span>
        </div>

        <section className="not-found-card apple-card">
          <div className="not-found-badge">
            <Compass className="h-3.5 w-3.5" />
            Page not found
          </div>

          <h1>This path wandered off the ledger</h1>
          <p>
            The page you&apos;re looking for doesn&apos;t exist, was moved, or never made it into
            the books. Let&apos;s get you back on track.
          </p>

          <div className="not-found-actions">
            <Link href="/" className="not-found-btn not-found-btn--primary">
              <Home className="h-4 w-4" />
              Take me home
            </Link>
            <Link href="/dashboard" className="not-found-btn not-found-btn--secondary">
              <ArrowLeft className="h-4 w-4" />
              Open dashboard
            </Link>
          </div>
        </section>

        <p className="not-found-footnote">Error 404 · SpendWise</p>
      </div>
    </main>
  );
}
