import { useCallback, useEffect, useRef, useState } from "react";
import { AIRPORTS, DESTINATIONS, FLEET, FLEET_SUMMARY_SPEC_COUNT, quote } from "./data.js";

/* ------------------------------------------------------------------ hooks */

// Adds an `in` class to elements when they scroll into view.
// dep: re-observe whenever this value changes so remounted .reveal elements are picked up.
function useScrollReveal(dep) {
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
  }, [dep]); // re-run when dep changes (e.g. route.view) to re-observe remounted elements
}

/* ---------------------------------------------------------------- routing */

// Returns { view: 'home' } or { view: 'fleet-detail', id: string }
function parseHash(hash) {
  const m = hash.match(/^#\/fleet\/([\w-]+)$/);
  if (m) return { view: "fleet-detail", id: m[1] };
  return { view: "home" };
}

function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const handler = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = useCallback((hash) => {
    window.location.hash = hash;
  }, []);

  return { route, navigate };
}

/* -------------------------------------------------------------------- nav */

const LINKS = [
  ["Fleet", "#fleet"],
  ["Destinations", "#destinations"],
  ["Membership", "#membership"],
  ["Settings", null],   // null href = action trigger (renders as button)
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

function Nav({ darkMode, onToggleTheme, onToggleSettings }) {
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
          {LINKS.map(([label, href]) =>
            href ? (
              <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>
            ) : (
              <button
                key={label}
                className="nav__link-btn"
                onClick={() => { onToggleSettings(); setOpen(false); }}
              >
                {label}
              </button>
            )
          )}
        </div>

        <div className="nav__cta">
          <button
            className="nav__theme-toggle"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            onClick={onToggleTheme}
          >
            {darkMode ? (
              /* Sun icon */
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round">
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
              /* Moon icon */
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <a className="btn btn--gold" href="#request">Request Access</a>
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
          <span className="line">
            <span className="reveal-load" style={{ animationDelay: ".25s" }}>
              Big plans, longer destinations,
            </span>
          </span>
          <span className="line">
            <span className="reveal-load" style={{ animationDelay: ".4s" }}>
              let us take you <em>there</em>
            </span>
          </span>
        </h1>

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

function Booking({ to, onToChange, jet: propJet, onJetChange }) {
  const [from, setFrom] = useState("TEB");
  const [date, setDate] = useState("");
  const [pax, setPax] = useState(4);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    // Use prefilled jet if set; otherwise recommend by passenger count.
    const jet = propJet ?? (Number(pax) <= 6 ? FLEET[0] : Number(pax) <= 9 ? FLEET[1] : FLEET[2]);
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
            <select id="to" value={to} onChange={(e) => onToChange(e.target.value)}>
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
          <div className="field">
            <label htmlFor="jet-select">Aircraft</label>
            <select
              id="jet-select"
              value={propJet?.id ?? "auto"}
              onChange={(e) => {
                const found = FLEET.find((j) => j.id === e.target.value) ?? null;
                onJetChange(found);
              }}
            >
              <option value="auto">Recommended by guests</option>
              {FLEET.map((j) => (
                <option key={j.id} value={j.id}>{j.name} ({j.klass})</option>
              ))}
            </select>
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

function Fleet({ onViewDetail }) {
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
              <div key={j.id} className="fleet__tab-group">
                <button
                  className={`fleet__tab ${j.id === active ? "active" : ""}`}
                  onClick={() => setActive(j.id)}
                >
                  <h3>{j.name}</h3>
                  <span>{j.klass}</span>
                </button>
                <a
                  href={`#/fleet/${j.id}`}
                  className="fleet__view-details"
                  onClick={(e) => { e.preventDefault(); onViewDetail(j.id); }}
                >
                  View details →
                </a>
              </div>
            ))}
          </div>

          <div className="fleet__display" key={jet.id}>
            <div className="fleet__plane">{jet.glyph}</div>
            <div className="badge">{jet.klass}</div>
            <h3 className="serif">{jet.name}</h3>
            <p>{jet.blurb}</p>
            <div className="fleet__specs">
              {jet.specs.slice(0, FLEET_SUMMARY_SPEC_COUNT).map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <button
              className="btn btn--ghost fleet__details-btn"
              onClick={() => onViewDetail(jet.id)}
            >
              Full specifications →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- gallery */

function Gallery({ images = [], altPrefix = "Aircraft" }) {
  const [idx, setIdx] = useState(0);
  const count = images.length;

  // Reset index when images array identity changes (navigating to different aircraft)
  useEffect(() => { setIdx(0); }, [images]);

  if (count === 0) {
    return (
      <div className="gallery gallery--empty" role="img" aria-label="No images available">
        <div className="gallery__placeholder">
          <span aria-hidden="true">✦</span>
          <p>No images available</p>
        </div>
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + count) % count);
  const next = () => setIdx((i) => (i + 1) % count);

  return (
    <div className="gallery" role="region" aria-label="Aircraft gallery">
      <div className="gallery__stage">
        <img
          className="gallery__img"
          src={images[idx]}
          alt={`${altPrefix} — image ${idx + 1} of ${count}`}
        />
        {count > 1 && (
          <>
            <button
              className="gallery__nav gallery__nav--prev"
              onClick={prev}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="gallery__nav gallery__nav--next"
              onClick={next}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="gallery__dots" role="tablist" aria-label="Gallery images">
          {images.map((_, i) => (
            <button
              key={i}
              role="tab"
              className={`gallery__dot ${i === idx ? "active" : ""}`}
              aria-label={`Image ${i + 1}`}
              aria-selected={i === idx}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- spec table */

function SpecTable({ specs }) {
  return (
    <div className="spec-table" role="table" aria-label="Aircraft specifications">
      {specs.map(([label, value]) => (
        <div key={label} className="spec-table__row" role="row">
          <span className="spec-table__label" role="rowheader">{label}</span>
          <b className="spec-table__value" role="cell">{value}</b>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- fleet not found */

function FleetNotFound({ onBack }) {
  return (
    <div className="fleet-not-found wrap">
      <button className="fleet-detail__back" onClick={onBack}>
        ← Back to fleet
      </button>
      <div className="fleet-not-found__body">
        <span className="fleet-not-found__glyph" aria-hidden="true">✦</span>
        <h2 className="serif">Aircraft not found</h2>
        <p>We couldn&rsquo;t find an aircraft matching that identifier.</p>
        <button className="btn btn--gold" onClick={onBack}>View all aircraft</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- fleet detail page */

function FleetDetailPage({ jet, onBack, onBookJet }) {
  if (!jet) return <FleetNotFound onBack={onBack} />;

  return (
    <div className="fleet-detail">
      <div className="fleet-detail__back-bar wrap">
        <button className="fleet-detail__back" onClick={onBack}>
          ← Back to fleet
        </button>
      </div>
      <div className="fleet-detail__body wrap">
        <header className="fleet-detail__header">
          <span className="badge">{jet.klass}</span>
          <h1 className="serif fleet-detail__title">{jet.name}</h1>
          <p className="fleet-detail__blurb">{jet.blurb}</p>
        </header>
        <section className="fleet-detail__gallery" aria-label="Gallery">
          <Gallery images={jet.images ?? []} altPrefix={jet.name} />
        </section>
        <section className="fleet-detail__specs-section">
          <h2 className="serif fleet-detail__section-title">Specifications</h2>
          <SpecTable specs={jet.specs} />
        </section>
        <div className="fleet-detail__cta">
          <button className="btn btn--gold" onClick={() => onBookJet(jet)}>
            Book {jet.name} <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- destinations */

function Destinations({ onSelectDestination }) {
  const [query, setQuery] = useState("");
  const filterRef = useRef(false); // tracks whether filter was ever active

  const q = query.trim().toLowerCase();
  const filtered = q
    ? DESTINATIONS.filter(
        (d) =>
          d.city.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q)
      )
    : DESTINATIONS;

  useEffect(() => {
    if (query) {
      filterRef.current = true;
    } else if (filterRef.current) {
      // query just cleared — add .in to any reveal cards that lack it
      document
        .querySelectorAll("#destinations .dest__card.reveal")
        .forEach((el) => el.classList.add("in"));
    }
  }, [query]);

  return (
    <section className="section-pad" id="destinations">
      <div className="wrap">
        <div className="section-head reveal">
          <h2 className="serif">
            Where the weekend{" "}
            <em style={{ color: "var(--brass-bright)" }}>begins</em>.
          </h2>
          <p>
            A living network of private terminals across the cities our
            members ask for most.
          </p>
        </div>

        {/* Search input */}
        <div className="dest__search">
          <input
            type="search"
            placeholder="Search destinations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter destinations"
          />
        </div>

        {/* Card grid or empty state */}
        {filtered.length === 0 ? (
          <p className="dest__empty">No destinations match your search.</p>
        ) : (
          <div className="dest__grid">
            {filtered.map((d, i) => (
              <a
                key={d.code}
                className={query ? "dest__card" : "dest__card reveal"}
                href="#book"
                style={query ? undefined : { transitionDelay: `${(i % 4) * 80}ms` }}
                onClick={(e) => { e.preventDefault(); onSelectDestination(d.code); }}
                onKeyDown={(e) => {
                  if (e.key === " ") { e.preventDefault(); onSelectDestination(d.code); }
                }}
              >
                <span className="time">{d.hours}h from {d.from}</span>
                <span className="code">{d.code}</span>
                <span className="city">{d.city}</span>
                <span className="country">{d.country}</span>
                <span className="price">{d.price}</span>
              </a>
            ))}
          </div>
        )}
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
        <p>Membership is reviewed personally. Tell us how you travel and we&rsquo;ll be in touch within one business day.</p>
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

/* --------------------------------------------------------- settings panel */

function SettingsPanel({ open, onClose }) {
  const [currency, setCurrency]         = useState("USD");
  const [distanceUnit, setDistanceUnit] = useState("km");

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-panel__header">
          <h2 className="serif">Settings</h2>
          <button
            className="settings-panel__close"
            aria-label="Close settings"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="settings-panel__body">
          {/* Control 1: Preferred currency */}
          <div className="settings-control">
            <label className="settings-control__label" htmlFor="sp-currency">
              Preferred currency
            </label>
            <select
              id="sp-currency"
              className="settings-control__select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
            </select>
          </div>

          {/* Control 2: Distance units */}
          <div className="settings-control">
            <span className="settings-control__label">Distance units</span>
            <div className="settings-control__toggle" role="group">
              {["km", "mi"].map((unit) => (
                <button
                  key={unit}
                  className={`toggle-btn ${distanceUnit === unit ? "active" : ""}`}
                  onClick={() => setDistanceUnit(unit)}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- back to top */

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll(); // set initial state on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      className={`back-to-top${visible ? " back-to-top--visible" : ""}`}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
           aria-hidden="true">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}

/* -------------------------------------------------------------------- app */

export default function App() {
  const root = useRef(null);
  const { route, navigate } = useHashRoute();
  useScrollReveal(route.view);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookingTo, setBookingTo] = useState("LCY");
  const [bookingJet, setBookingJet] = useState(null);

  function handleSelectDestination(code) {
    setBookingTo(code);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleViewDetail(id) {
    navigate(`#/fleet/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBookJet(jet) {
    setBookingJet(jet);
    navigate("#");
    setTimeout(() => {
      document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    // Trigger the staggered hero load animation after first paint.
    const id = requestAnimationFrame(() => root.current?.classList.add("loaded"));
    return () => cancelAnimationFrame(id);
  }, []);

  const navProps = {
    darkMode,
    onToggleTheme: () => setDarkMode((d) => !d),
    onToggleSettings: () => setSettingsOpen((s) => !s),
  };

  const settingsProps = {
    open: settingsOpen,
    onClose: () => setSettingsOpen(false),
  };

  if (route.view === "fleet-detail") {
    const jet = FLEET.find((j) => j.id === route.id);
    return (
      <div ref={root}>
        <Nav {...navProps} />
        <FleetDetailPage
          jet={jet}
          onBack={() => navigate("#fleet")}
          onBookJet={handleBookJet}
        />
        <SettingsPanel {...settingsProps} />
        <BackToTop />
      </div>
    );
  }

  return (
    <div ref={root}>
      <Nav {...navProps} />
      <Hero />
      <Booking
        to={bookingTo}
        onToChange={setBookingTo}
        jet={bookingJet}
        onJetChange={setBookingJet}
      />
      <Fleet onViewDetail={handleViewDetail} />
      <Destinations onSelectDestination={handleSelectDestination} />
      <Membership />
      <CTA />
      <Footer />
      <SettingsPanel {...settingsProps} />
      <BackToTop />
    </div>
  );
}
