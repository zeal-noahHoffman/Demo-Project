import { useEffect, useRef, useState } from "react";
import { AIRPORTS, DESTINATIONS, FLEET, quote } from "./data.js";

/* ------------------------------------------------------------------ hooks */

// Adds an `in` class to elements when they scroll into view.
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* -------------------------------------------------------------------- nav */

const LINKS = [
  ["Fleet", "#fleet"],
  ["Destinations", "#destinations"],
  ["Membership", "#membership"],
];

function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 4l2.6 8.4L27 15l-8.4 2.6L16 26l-2.6-8.4L5 15l8.4-2.6z"
        fill="currentColor"
      />
    </svg>
  );
}

function Nav({ darkMode, onToggle }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""} ${open ? "open" : ""}`}>
      <div className="wrap nav__inner">
        <a className="brand" href="#top">
          <span className="brand__mark"><Logo /></span>
          <span className="brand__name">Skyline <b>Airways</b></span>
        </a>

        <div className="nav__links">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
        </div>

        <div className="nav__cta">
          <a className="btn btn--gold" href="#request">Request Access</a>
          <button
            className="nav__dark-toggle"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            onClick={onToggle}
          >
            {darkMode ? (
              /* Sun icon — shown in dark mode */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              /* Moon icon — shown in light mode */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button
            className="nav__toggle"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6">
              {open ? <path d="M6 6l14 14M20 6L6 20" /> : <><path d="M4 8h18" /><path d="M4 13h18" /><path d="M4 18h18" /></>}
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------- hero */

function Hero() {
  // A quadratic arc from lower-left to upper-right that the plane rides.
  const path = "M 80 560 Q 720 120 1360 360";
  return (
    <header className="hero" id="top">
      <div className="hero__sky" />
      <div className="hero__stars" />
      <div className="hero__sun" />

      <svg className="hero__path" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice">
        <path className="arc" d={path} />
        <path
          className="hero__plane"
          style={{ "--flight": `path("${path}")` }}
          d="M -10 0 L 14 0 L 6 -5 L 22 -5 L 10 0 L 22 5 L 6 5 Z"
          transform="scale(1.1)"
        />
      </svg>

      <div className="wrap hero__content">
        <span className="eyebrow fade-load" style={{ animationDelay: ".2s" }}>
          Private charter · Members only · Est. 1998
        </span>

        <h1 className="serif hero__title">
          <span className="line"><span className="reveal-load" style={{ animationDelay: ".25s" }}>The sky,</span></span>
          <span className="line"><span className="reveal-load" style={{ animationDelay: ".4s" }}><em>privately</em> yours.</span></span>
        </h1>

        <p className="hero__lede fade-load" style={{ animationDelay: ".7s" }}>
          Hello World! This is my first ticket from the agent
        </p>

        <div className="hero__actions fade-load" style={{ animationDelay: ".9s" }}>
          <a className="btn btn--gold" href="#book">Plan a flight <span className="arrow">→</span></a>
          <a className="btn btn--ghost" href="#fleet">Explore the fleet</a>
        </div>
      </div>

      <div className="hero__meta fade-load" style={{ animationDelay: "1.1s" }}>
        <div className="stat"><b>4 min</b><span>Curb to cabin</span></div>
        <div className="stat"><b>320+</b><span>Global airfields</span></div>
        <div className="stat"><b>24/7</b><span>On-demand</span></div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- booking */

function Booking() {
  const [from, setFrom] = useState("TEB");
  const [to, setTo] = useState("LCY");
  const [date, setDate] = useState("");
  const [pax, setPax] = useState(4);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    // Recommend a jet by passenger count.
    const jet = pax <= 6 ? FLEET[0] : pax <= 9 ? FLEET[1] : FLEET[2];
    const q = quote(from, to, Number(pax), jet);
    if (!q) {
      setError("Please choose two different airports.");
      setResult(null);
      return;
    }
    setError("");
    setResult(q);
  };

  return (
    <section className="wrap booking" id="book">
      <div className="booking__card">
        <form className="booking__form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="from">From</label>
            <select id="from" value={from} onChange={(e) => setFrom(e.target.value)}>
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="to">To</label>
            <select id="to" value={to} onChange={(e) => setTo(e.target.value)}>
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="date">Departure</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pax">Guests</label>
            <input id="pax" type="number" min="1" max="14" value={pax}
              onChange={(e) => setPax(e.target.value)} />
          </div>
          <div className="booking__submit">
            <button className="btn btn--gold" type="submit">Get quote <span className="arrow">→</span></button>
          </div>
        </form>

        {error && (
          <div className="quote" style={{ gridTemplateColumns: "1fr", color: "var(--horizon)" }}>
            {error}
          </div>
        )}

        {result && (
          <div className="quote">
            <div className="quote__route">
              {result.from.city} <span style={{ color: "var(--brass-bright)" }}>→</span> {result.to.city}
              <small>{result.from.code} · {result.to.code} · {result.km.toLocaleString()} km</small>
            </div>
            <div className="quote__item">
              <span>Aircraft</span>
              <b>{result.jet.name}</b>
            </div>
            <div className="quote__item">
              <span>Flight time</span>
              <b>{result.durationLabel}</b>
            </div>
            <div className="quote__item quote__price">
              <span>Est. all-in</span>
              <b>${result.price.toLocaleString()}</b>
            </div>
            <div className="booking__submit" style={{ padding: 0 }}>
              <a className="btn btn--ghost" href="#request">Reserve</a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ fleet */

function Fleet() {
  const [active, setActive] = useState(FLEET[1].id);
  const jet = FLEET.find((j) => j.id === active);

  return (
    <section className="fleet section-pad" id="fleet">
      <div className="wrap">
        <div className="section-head reveal">
          <h2 className="serif">A fleet for <em style={{ color: "var(--brass-bright)" }}>every</em> distance.</h2>
          <p>Three aircraft, one standard. Choose the silhouette that fits the journey — we handle the rest.</p>
        </div>

        <div className="fleet__layout reveal">
          <div className="fleet__tabs">
            {FLEET.map((j) => (
              <button
                key={j.id}
                className={`fleet__tab ${j.id === active ? "active" : ""}`}
                onClick={() => setActive(j.id)}
              >
                <h3>{j.name}</h3>
                <span>{j.klass}</span>
              </button>
            ))}
          </div>

          <div className="fleet__display" key={jet.id}>
            <div className="fleet__plane">{jet.glyph}</div>
            <div className="badge">{jet.klass}</div>
            <h3 className="serif">{jet.name}</h3>
            <p>{jet.blurb}</p>
            <div className="fleet__specs">
              {jet.specs.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- destinations */

function Destinations() {
  return (
    <section className="section-pad" id="destinations">
      <div className="wrap">
        <div className="section-head reveal">
          <h2 className="serif">Where the weekend <em style={{ color: "var(--brass-bright)" }}>begins</em>.</h2>
          <p>A living network of private terminals across the cities our members ask for most.</p>
        </div>

        <div className="dest__grid">
          {DESTINATIONS.map((d, i) => (
            <a
              key={d.code}
              className="dest__card reveal"
              href="#book"
              style={{ transitionDelay: `${(i % 4) * 80}ms` }}
            >
              <span className="time">{d.hours}h from {d.from}</span>
              <span className="code">{d.code}</span>
              <span className="city">{d.city}</span>
              <span className="country">{d.country}</span>
              <span className="price">{d.price}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- membership */

const TIERS = [
  {
    name: "Explorer",
    price: "3k",
    period: "/ year",
    feature: false,
    perks: [
      "6 flight hours included",
      "Light jet access",
      "48-hour booking window",
      "Dedicated travel desk",
    ],
  },
  {
    name: "Voyager",
    price: "12k",
    period: "/ year",
    feature: false,
    perks: ["25 flight hours included", "Light & midsize access", "48-hour booking window", "Dedicated travel desk"],
  },
  {
    name: "Horizon",
    price: "20k",
    period: "/ year",
    feature: true,
    perks: ["120 flight hours included", "Full-fleet access", "10-hour guaranteed availability", "Fixed hourly rates", "Complimentary empty-leg upgrades"],
  },
  {
    name: "Adventure",
    price: "40k",
    period: "/ year",
    feature: false,
    perks: [
      "24 flight hours included",
      "Full jet access",
      "8-hour booking window",
      "Complimentary free checked bags",
    ],
  },
];

function Membership() {
  return (
    <section className="member section-pad" id="membership">
      <div className="wrap">
        <div className="section-head reveal">
          <h2 className="serif">Membership, not <em style={{ color: "var(--brass-bright)" }}>ticketing</em>.</h2>
          <p>One commitment unlocks the whole fleet. No surge pricing, no surprises at the hangar.</p>
        </div>

        <div className="member__grid">
          {TIERS.map((t, i) => (
            <div
              key={t.name}
              className={`tier reveal ${t.feature ? "tier--feature" : ""}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <h3 className="serif">{t.name}</h3>
              <div className="price">
                <b>{t.price.startsWith("Bespoke") ? "" : "$"}{t.price}</b>
                <span> {t.period}</span>
              </div>
              <ul>
                {t.perks.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <a className={`btn ${t.feature ? "btn--gold" : "btn--ghost"}`} href="#request">
                Choose {t.name}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- cta + footer */

function CTA() {
  return (
    <section className="cta" id="request">
      <div className="wrap reveal">
        <span className="eyebrow" style={{ justifyContent: "center", display: "flex" }}>
          By invitation
        </span>
        <h2 className="serif">Your runway<br /><em style={{ color: "var(--brass-bright)" }}>is waiting.</em></h2>
        <p>Membership is reviewed personally. Tell us how you travel and we'll be in touch within one business day.</p>
        <a className="btn btn--gold" href="#top">Request access <span className="arrow">→</span></a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__brand">
            <a className="brand" href="#top">
              <span className="brand__mark"><Logo /></span>
              <span className="brand__name">Skyline <b>Airways</b></span>
            </a>
            <p>Private charter aviation for the few who fly differently. Operated under Part 135. This is a demo experience.</p>
          </div>
          <div className="footer__cols">
            <div className="footer__col">
              <h4>Contact</h4>
              <a href="#top">testingDemo@email.com</a>
              <a href="#top">+1 (800) 425-2628</a>
              <a href="#top">Teterboro, NJ</a>
            </div>
            <div className="footer__col">
              <h4>Fly</h4>
              <a href="#fleet">The Fleet</a>
              <a href="#destinations">Destinations</a>
              <a href="#book">Get a quote</a>
            </div>
            <div className="footer__col">
              <h4>Company</h4>
              <a href="#membership">Membership</a>
              <a href="#request">Request access</a>
              <a href="#top">Safety</a>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Skyline Airways. A demonstration site.</span>
          <span>Privacy · Terms · Operating Certificate</span>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------- app */

export default function App() {
  const root = useRef(null);
  const [darkMode, setDarkMode] = useState(false);
  useScrollReveal();

  useEffect(() => {
    // Trigger the staggered hero load animation after first paint.
    const id = requestAnimationFrame(() => root.current?.classList.add("loaded"));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div ref={root} data-theme={darkMode ? "dark" : undefined}>
      <Nav darkMode={darkMode} onToggle={() => setDarkMode((d) => !d)} />
      <Hero />
      <Booking />
      <Fleet />
      <Destinations />
      <Membership />
      <CTA />
      <Footer />
    </div>
  );
}
