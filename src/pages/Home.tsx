import { Link } from "react-router-dom";
import { Star } from "../components/Star";

const ledger: [string, string][] = [
  ["01", "Original artwork only. Star charts are drawn from public astronomical data, never from other labels’ work."],
  ["02", "Printed to order, so nothing is made until someone wants it — and delivery times are stated plainly."],
  ["03", "Prices, shipping and returns are shown before checkout. No countdown timers, no invented scarcity."],
];

export function Home() {
  return (
    <>
      <section className="hero on-ink" aria-labelledby="hero-title">
        <p className="rail">Collection 01 — in development</p>
        <Star className="star" />
        <img className="wordmark" src="/brand/noctra-logo-bone.png" width={1200} height={344} alt="Noctra" />
        <div className="meta">
          <p className="eyebrow">An editorial night label</p>
          <h1 id="hero-title" className="sr-only">Noctra</h1>
          <p>Garments and prints for people who keep the late hours. The first collection is being drawn now.</p>
          <p><Link to="/about/">Read the studio notes</Link></p>
        </div>
      </section>

      <section className="section" aria-labelledby="principles">
        <h2 id="principles">What we promise before we sell anything.</h2>
        <div className="body">
          <p>Noctra is a one-person studio. That means a small range, made carefully, described honestly.</p>
        </div>
        <ol className="ledger">
          {ledger.map(([n, t]) => (
            <li key={n}><span className="n">{n}</span><span>{t}</span></li>
          ))}
        </ol>
      </section>
    </>
  );
}
