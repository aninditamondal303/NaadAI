/** Reference pages in the library: taals and thekas, vocal forms, gharanas. */
import React, { useMemo } from "react";
import { ExternalLink, Play } from "lucide-react";
import { TAALS, type Taal } from "../../data/taals";
import { FORMS, FORM_GROUPS, GHARANAS } from "../../data/forms";
import { RAAG_LIST } from "../../data/allRaags";
import { RAAG_SOURCE_INFO } from "../../data/raagsTanarang";
import { useUi } from "../../i18n/ui";

const CORE = 10; // the first ten taals are the commonly taught set

const ThekaGrid: React.FC<{ taal: Taal }> = ({ taal }) => {
  let k = 0;
  return (
    <div className="rf-theka" role="table" aria-label={`Theka of ${taal.name}`}>
      {taal.vibhags.map((v, vi) => {
        const cells = taal.theka.slice(k, k + v);
        const start = k;
        k += v;
        const clap = taal.claps[vi];
        return (
          <div key={vi} className="rf-vibhag" role="row">
            {cells.map((bols, j) => (
              <div key={j} className="rf-matra" role="cell">
                <span className="rf-bol">{bols.join(" ")}</span>
                <span className="rf-num">{start + j + 1}</span>
                {j === 0 && <span className={`rf-clap ${clap === "0" ? "rf-khali" : clap === "X" ? "rf-sam" : ""}`}>{clap === "X" ? "×" : clap}</span>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export const TaalsReference: React.FC<{ onOpenTaal?: (id: string) => void }> = ({ onOpenTaal }) => {
  const u = useUi();
  const groups: [string, Taal[]][] = [[u("rfTaalsCore"), TAALS.slice(0, CORE)], [u("rfTaalsMore"), TAALS.slice(CORE)]];
  return (
    <div className="rf">
      <p className="lib-intro">{u("rfTaalsIntro")}</p>
      {groups.map(([label, list]) => (
        <section key={label} className="rf-group">
          <h2 className="rz-h2">{label}</h2>
          <div className="rf-list">
            {list.map(t => (
              <article key={t.id} className="rf-card" id={`taal-${t.id}`}>
                <header className="rf-card-head">
                  <div>
                    <h3>{t.name}</h3>
                    <p>{u("rfTaalMeta", t.matras, t.vibhags.join(" + "))}</p>
                  </div>
                  {onOpenTaal && (
                    <button type="button" className="btn btn-ghost" onClick={() => onOpenTaal(t.id)}>
                      <Play size={15} aria-hidden /> {u("rfPlayTaal")}
                    </button>
                  )}
                </header>
                <ThekaGrid taal={t} />
                <p className="rf-usage">{t.usage}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
      <p className="rf-source">{u("rfTaalsSource")} <a href="https://digitabla.com/reference/tals-and-thekas/extended-list/" target="_blank" rel="noreferrer">digitabla.com <ExternalLink size={12} aria-hidden /></a></p>
    </div>
  );
};

/** Raags in the library with a published composition whose type matches. */
function raagsWithForm(types: string[]) {
  const out: { id: string; name: string }[] = [];
  for (const r of RAAG_LIST) {
    const info = RAAG_SOURCE_INFO[r.id];
    if (info?.b.some(([, type]) => types.some(t => type.toLowerCase().includes(t)))) out.push({ id: r.id, name: r.name.replace(/^Raag\s+/i, "").replace(/\s*\(.*\)/, "") });
  }
  return out;
}

export const FormsReference: React.FC<{ onOpenRaag: (id: string) => void; onOpenTaal?: (id: string) => void }> = ({ onOpenRaag, onOpenTaal }) => {
  const u = useUi();
  const withRaags = useMemo(() => Object.fromEntries(FORMS.map(f => [f.id, raagsWithForm(f.matchTypes)])), []);
  return (
    <div className="rf">
      <p className="lib-intro">{u("rfFormsIntro")}</p>
      {FORM_GROUPS.map(g => (
        <section key={g.id} className="rf-group">
          <h2 className="rz-h2">{u(`rfGroup_${g.id}` as "rfGroup_classical")}</h2>
          <div className="rf-list rf-list-forms">
            {FORMS.filter(f => f.group === g.id).map(f => (
              <article key={f.id} className="rf-card" id={`form-${f.id}`}>
                <header className="rf-card-head">
                  <div>
                    <h3>{f.name} <span className="rf-deva" lang="hi">{f.deva}</span></h3>
                    <p>{f.summary}</p>
                  </div>
                </header>
                <ul className="rf-points">{f.features.map((x, i) => <li key={i}>{x}</li>)}</ul>
                <dl className="rf-meta">
                  <div>
                    <dt>{u("rfUsualTaals")}</dt>
                    <dd>{f.taals.map(id => {
                      const t = TAALS.find(x => x.id === id);
                      return t ? <button key={id} type="button" className="rf-chip" onClick={() => onOpenTaal?.(id)}>{t.name}</button> : null;
                    })}</dd>
                  </div>
                  {withRaags[f.id].length > 0 && (
                    <div>
                      <dt>{u("rfRaagsWithForm")}</dt>
                      <dd>{withRaags[f.id].slice(0, 24).map(r => <button key={r.id} type="button" className="rf-chip rf-chip-raag" onClick={() => onOpenRaag(r.id)}>{r.name}</button>)}
                        {withRaags[f.id].length > 24 && <span className="rf-more">{u("rfAndMore", withRaags[f.id].length - 24)}</span>}</dd>
                    </div>
                  )}
                </dl>
                {f.sources.length > 0 && <p className="rf-source">{u("rfReadMore")} {f.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label} <ExternalLink size={12} aria-hidden /></a>)}</p>}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export const GharanasReference: React.FC = () => {
  const u = useUi();
  return (
    <div className="rf">
      <p className="lib-intro">{u("rfGharanaIntro")}</p>
      <div className="rf-table-wrap">
        <table className="rf-table">
          <thead><tr><th>{u("rfGharana")}</th><th>{u("rfPlace")}</th><th>{u("rfFounder")}</th></tr></thead>
          <tbody>
            {GHARANAS.map(g => (
              <tr key={g.id}><td><a href={`#gh-${g.id}`} onClick={e => { e.preventDefault(); document.getElementById(`gh-${g.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{g.name}</a></td><td>{g.place}</td><td>{g.founders}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rf-list rf-list-forms">
        {GHARANAS.map(g => (
          <article key={g.id} className="rf-card" id={`gh-${g.id}`}>
            <header className="rf-card-head"><div><h3>{g.name}</h3><p>{g.place}</p></div></header>
            <ul className="rf-points">{g.style.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <dl className="rf-meta">
              <div><dt>{u("rfFounder")}</dt><dd>{g.founders}</dd></div>
              <div><dt>{u("rfExponents")}</dt><dd>{g.exponents}</dd></div>
            </dl>
            {g.note && <p className="rf-note">{g.note}</p>}
            <p className="rf-source">{u("rfReadMore")} {g.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label} <ExternalLink size={12} aria-hidden /></a>)}</p>
          </article>
        ))}
      </div>
      <p className="rf-source">{u("rfGharanaNote")}</p>
    </div>
  );
};
