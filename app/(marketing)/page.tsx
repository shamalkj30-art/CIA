import Link from 'next/link'
import './landing.css'

export const metadata = {
  title: 'Cyncro — det som husker for deg',
  description:
    'Personal Proof & Money OS. Cyncro leser ordrebekreftelsene dine, finner kjøpene, og holder orden på garanti- og returfrister. Du leter aldri etter en kvittering igjen.',
}

export default function HomePage() {
  return (
    <div className="cyncro-landing">
      {/* ===== HEADER ===== */}
      <header className="site-header" role="banner">
        <div className="site-header-inner">
          <Link href="/" className="wordmark">
            <span className="stamp" aria-hidden="true">C</span>
            Cyncro
          </Link>
          <Link href="/login" className="btn btn--secondary">Logg inn</Link>
        </div>
      </header>

      <main>
        {/* ===== HERO — asymmetric ===== */}
        <section className="hero" aria-label="Introduksjon">
          <div>
            <div className="eyebrow">Personal Proof &amp; Money OS</div>
            <h1>Det som husker for deg.</h1>
            <p className="lede">
              Cyncro leser ordrebekreftelsene i e-posten din, henter ut kjøpene,
              og holder orden på garantifristene, returvinduene og
              abonnementsfornyelsene. Du leter aldri etter en kvittering igjen.
            </p>

            <p className="anchor">
              I gjennomsnitt finner nye brukere{' '}
              <strong className="num">1 247 kr</strong> i garantirestid de
              trodde de hadde mistet — i løpet av første uke.
            </p>

            <div className="hero-actions">
              <Link href="/signup" className="btn btn--primary">
                Koble til Gmail og finn alt
              </Link>
              <a href="#how" className="btn btn--secondary">
                Se hvordan det fungerer
              </a>
            </div>
            <p className="hero-note">
              Vi leser kun ordrebekreftelser — aldri noe annet. Du kan trekke
              tilgangen når som helst.
            </p>
          </div>

          {/* Receipt artifact stack — receipts ARE the product */}
          <div className="receipt-stack" aria-hidden="true">
            <article className="receipt r-1">
              <h4>Elkjøp — Oslo City</h4>
              <div className="line"><span>Sony WH-1000XM5</span><span className="num">3 990,00</span></div>
              <div className="line"><span>Garanti, 24 mnd.</span><span className="num">—</span></div>
              <div className="line"><span>MVA 25 %</span><span className="num">798,00</span></div>
              <div className="line total"><span>Sum</span><span className="num">3 990,00 NOK</span></div>
              <div className="line muted" style={{ marginTop: 8, fontSize: 11 }}>
                Ordre #18293 · 14.03.2026
              </div>
            </article>

            <article className="receipt r-2">
              <h4>IKEA Slependen</h4>
              <div className="line"><span>BILLY bokhylle</span><span className="num">899,00</span></div>
              <div className="line"><span>Frakt</span><span className="num">149,00</span></div>
              <div className="line total"><span>Sum</span><span className="num">1 048,00 NOK</span></div>
              <div className="line muted" style={{ marginTop: 8, fontSize: 11 }}>
                365 dagers åpent kjøp · 02.04.2026
              </div>
            </article>

            <article className="receipt r-3">
              <h4>Spotify Premium Family</h4>
              <div className="line"><span>Månedlig abonnement</span><span className="num">169,00</span></div>
              <div className="line total"><span>Neste trekk</span><span className="num">25.06.2026</span></div>
              <div className="line muted" style={{ marginTop: 8, fontSize: 11 }}>
                Pris justert opp 10 kr forrige måned
              </div>
            </article>
          </div>
        </section>

        {/* ===== SECTION 1: hva du finner igjen ===== */}
        <section className="editorial" id="how" aria-label="Hva du finner igjen">
          <div className="editorial-head">
            <div>
              <h2>Det du allerede har kjøpt, men ikke vet hvor er.</h2>
              <p className="muted" style={{ marginTop: 16 }}>
                Vi går gjennom ordrebekreftelsene de siste 18 månedene. Henter
                ut kjøp, priser, garantiperioder, returvinduer. Lagret i ett
                gjennomsøkbart vault.
              </p>
            </div>
            <div className="section-number">
              <span className="num">1 247 kr</span>
              <small>i gjenfunnet garantirestid (snitt, første uke)</small>
            </div>
          </div>

          <p>
            Du har sannsynligvis to-tre kjøp på mer enn 1 000 kr som fortsatt er
            innenfor garantitiden — uten at du vet det. Det er ikke fordi du er
            rotete. Det er fordi e-posten din er full av annet, og kvitteringer
            ikke har en god plass å bo.
          </p>
        </section>

        {/* ===== SECTION 2: deadlines ===== */}
        <section className="editorial" aria-label="Frister som telles ned">
          <div className="editorial-head">
            <div>
              <h2>Vi teller ned. Du gjør noe med det.</h2>
              <p className="muted" style={{ marginTop: 16 }}>
                Hvert kjøp har en utløpsdato — garanti, retur, fri prøveperiode,
                fornyelse. Cyncro vet hvilken, og varsler i god tid.
              </p>
            </div>
            <div className="section-number">
              <span className="num">14 dager</span>
              <small>til neste viktige frist (eksempel under)</small>
            </div>
          </div>

          <article className="timeline-card">
            <div className="timeline-row">
              <div className="tl-item">
                <h3>Sony WH-1000XM5</h3>
                <div className="meta num">Garanti utløper 14.03.2028 · 705 dager igjen</div>
              </div>
              <div className="tl-bar" aria-label="Garanti: 24 av 730 dager brukt">
                <span style={{ width: '3%' }} />
                <span className="today" style={{ left: '3%' }} />
              </div>
              <div className="tl-amount">
                <span className="num">3 990 kr</span>
                <span className="label">forsikret</span>
              </div>
            </div>
          </article>

          <article className="timeline-card">
            <div className="timeline-row">
              <div className="tl-item">
                <h3>Spotify Premium Family</h3>
                <div className="meta num">Neste trekk 25.06.2026 · 5 dager igjen</div>
              </div>
              <div className="tl-bar warn" aria-label="Abonnement: 5 dager til fornyelse">
                <span style={{ width: '83%' }} />
                <span className="today" style={{ left: '83%' }} />
              </div>
              <div className="tl-amount">
                <span className="num">169 kr</span>
                <span className="label">trekkes</span>
              </div>
            </div>
          </article>

          <article className="timeline-card">
            <div className="timeline-row">
              <div className="tl-item">
                <h3>Disney+ — gratis prøveperiode</h3>
                <div className="meta num">Blir betalende 22.06.2026 · 2 dager igjen</div>
              </div>
              <div className="tl-bar critical" aria-label="Gratis prøveperiode: 2 dager igjen">
                <span style={{ width: '93%' }} />
                <span className="today" style={{ left: '93%' }} />
              </div>
              <div className="tl-amount">
                <span className="num">119 kr / mnd</span>
                <span className="label">starter</span>
              </div>
            </div>
          </article>
        </section>

        {/* ===== SECTION 3: skadebehandler / insurance context ===== */}
        <section className="editorial" aria-label="Når det virkelig betyr noe">
          <div className="editorial-head">
            <div>
              <h2>Når skadebehandleren spør om kvittering.</h2>
              <p className="muted" style={{ marginTop: 16 }}>
                Hver gang du melder en skade — vannskade, innbrudd, reise —
                kommer spørsmålet: «Har du kvitteringen?» De fleste finner den
                ikke. Da diskuteres erstatningsbeløpet, og du tar tapet.
              </p>
            </div>
            <div className="section-number">
              <span className="num">73 %</span>
              <small>av nordmenn finner ikke kvitteringen når de trenger den</small>
            </div>
          </div>

          <blockquote className="quote">
            «Den vanligste friksjonen i en skademelding er ikke at kunden ikke
            har rett — det er at de ikke har dokumentasjonen. Når kunden kan
            vise kvitteringen umiddelbart, går saken raskere og oppgjøret blir
            riktig.»
            <cite>— skadebehandler, syv års erfaring</cite>
          </blockquote>
        </section>
      </main>

      {/* ===== CTA ===== */}
      <aside className="cta" id="cta" aria-label="Kom i gang">
        <div>
          <h2>Koble til Gmail. Få oversikten på 90 sekunder.</h2>
          <p className="muted">
            Vi leser ordrebekreftelser fra de siste 18 månedene, henter ut
            kjøpene, og setter opp fristene. Du gjør ingenting annet.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          <Link href="/signup" className="btn btn--primary">
            Koble til Gmail og finn alt
          </Link>
          <span className="hero-note">
            Ingen kort, ingen forpliktelser. Trekk tilgangen når som helst.
          </span>
        </div>
      </aside>

      <footer className="site-footer" role="contentinfo">
        <span>Cyncro · bygget i Norge</span>
        <span>
          <Link href="/security">Personvern</Link>
          <span className="sep">·</span>
          <Link href="/security">Sikkerhet</Link>
          <span className="sep">·</span>
          <a href="mailto:hei@cyncro.no">hei@cyncro.no</a>
        </span>
      </footer>
    </div>
  )
}
