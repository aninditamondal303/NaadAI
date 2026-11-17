/**
 * Mukhya ang (principal phrases) and vishranti sthan (resting swaras) of each
 * raag, as listed on tanarang.com, the raag reference of Acharya
 * Vishwanath Rao Ringe "Tanarang". Copied in the site's own notation (kept
 * exactly as published) and converted to the app's notation below:
 *   site ",N" (mandra) -> app "N,";  site "S'" (taar) -> app "S'";
 *   lowercase = komal (shuddha Ma is "m"), "M" = tivra Ma;
 *   "(x)" marks a kan (grace) swara, which is left out of playable phrases.
 * Four raags in the app are not on that site (Kalingada, Anand Bhairav,
 * Asavari; Dhanashree is listed there only in its Bhairavi-ang form): their
 * phrases come from the app's own notes and are marked as such.
 */
export interface AngEntry { ang: string; vishranti: string; source: "tanarang" | "app"; url?: string }

const T = (slug: string) => `https://tanarang.com/wordpress/${slug}/`;

export const MUKHYA_ANG: Record<string, AngEntry> = {
  yaman: { ang: ",N R G ; ,N R M G ; M P ; M D P N D P M R G R ; ,N R ,D ,N S;", vishranti: "S; G; N; - S'; N; P; G;", source: "tanarang", url: T("raag-yaman") },
  bhupali: { ang: "G R G; P G; D P; S' D P G; P G R G; G R S;", vishranti: "S; R; G; P; - P; G; R; S;", source: "tanarang", url: T("raag-bhoopali") },
  shuddhakalyan: { ang: "G R G ; R S ; ,N ,D ,P ; G R S ; G R G ; P R S ;", vishranti: "S; G; P; - P; G; S;", source: "tanarang", url: T("raag-shuddha-kalyan-2") },
  hindol: { ang: "D D N M D S' ; D M G ; S ,D ,D S;", vishranti: "G; D; S'; - D; G;", source: "tanarang", url: T("raag-hindol") },
  kedar: { ang: "S m ; m P; M P D P m ; S R S ; M P D P M ; P S'; S' R' S' S' D D P;", vishranti: "S; m; P; - S'; P; m;", source: "tanarang", url: T("raag-kedar") },
  hansasdhwani: { ang: ",N R G P G R G P N S'; S' N P G R G P G R S;", vishranti: "G P N - S' N P G;", source: "tanarang", url: T("raag-hansdhwani") },
  shyamkalyan: { ang: "S R ,N S (m)R ; R M M P ; P G m R ; M P ; G m P ; G m R ; ,N S R S;", vishranti: "S; R; P; N; - S'; N; P; R;", source: "tanarang", url: T("raag-shyam-kalyan") },
  chayanat: { ang: ",P R R ; R G m P ; G m R S ; S' P R G ; m G m R S R S;", vishranti: "R; G; P; - S'; P; R;", source: "tanarang", url: T("raag-chhayanut") },
  bhairav: { ang: "r r S ; d d P ; G m d d P ; G m r r S ; ,N S;", vishranti: "S; m; P; d; - S'; d; P; r;", source: "tanarang", url: T("raag-bhairav") },
  ahirbhairav: { ang: "G m P ; D n D ; P D P ; S' n D ; n D P m G m ; G m P m r r S ; ,n ,D ,n r r S;", vishranti: "S; r; m; P; - S'; P; m; r;", source: "tanarang", url: T("raag-aheer-bhairav") },
  natbhairav: { ang: "R G m d P ; m G R ; G m R S ,N ,d S ;", vishranti: "R; m; d; - d; m; R;", source: "tanarang", url: T("raag-nut-bhairav") },
  gunakri: { ang: "S r m P d ; P d m r ; r S ,d S ; m P d d S' ; d P d m ; P m r S ;", vishranti: "S; r; d; - d; r; S;", source: "tanarang", url: T("raag-gunkali") },
  ramkali: { ang: "M P d n d P ; M P G m r S ;", vishranti: "S; P; - S'; P; r;", source: "tanarang", url: T("raag-ramkali") },
  jogia: { ang: "r m m ; m P d ; P d N d P ; P d m r S;", vishranti: "S; m; P; d; - S'; d; m; r;", source: "tanarang", url: T("raag-jogiya") },
  bageshree: { ang: ",n S m ; S g m ; g R S ; ,n ,D ; m D n D ; m g R S;", vishranti: "S; m; D; - S'; D; m; g;", source: "tanarang", url: T("raag-bageshree") },
  bhimpalasi: { ang: ",n S g m P ; n D P ; S' ; n D P ; m g R S;", vishranti: "S; m; P; - S'; P; m;", source: "tanarang", url: T("raag-bheempalasi") },
  kafi: { ang: "g R ; m P ; m P D P ; D n S' ; n D P;", vishranti: "S P - S' P R;", source: "tanarang", url: T("raag-kafi") },
  patdeep: { ang: "g m P N S' D P ; m g m P N N N S' ; D P m g m P ; P g m ; g R S ,N ,N S;", vishranti: "g; P; N; - D; P; R;", source: "tanarang", url: T("raag-patdeep") },
  vrindavanisarang: { ang: "R m ; P R ; m R ,N S ; m P n P m R ,N S ;", vishranti: "S; R; P; N; - S'; P; R;", source: "tanarang", url: T("raag-sarang-raag-brindavani-sarang") },
  pilu: { ang: "G m P N S' ; n D P ; m P N d P ; m g R S ; P g R S ,N ; S g R S ;", vishranti: "S; G; P; N; - n; P; g;", source: "tanarang", url: T("raag-pilu") },
  darbari: { ang: "S R g (R)g ; m P d (P)d n P ; n m P S' ; S' (n)d n P m P (m)g m R S ; ,d ,n S;", vishranti: "S; R; P; - S'; P; R;", source: "tanarang", url: T("raag-darbari-kanada") },
  jaunpuri: { ang: "R m P ; d m P S' ; R' n d P ; m P n d P ; d m P g R m P ;", vishranti: "R; P; d; S'; - d; P; g; R;", source: "tanarang", url: T("raag-jaunpuri") },
  desi: { ang: "R m P ; D m P S' ; S' P D m P ; R g S R ,n S;", vishranti: "S; R; P; - P; R; S;", source: "tanarang", url: T("raag-desi") },
  adana: { ang: "m P d n S' ; S' d n S' ; S' d n P ; m P ; g m R S;", vishranti: "P; n; - S'; P; R;", source: "tanarang", url: T("raag-adana-2") },
  bhairavi: { ang: "g S r S ; g m P ; d m d n S' ; r' S' d P g m r S;", vishranti: "S; m; P; - S'; P; m;", source: "tanarang", url: T("raag-bhairavi") },
  malkauns: { ang: ",d ,n S g m; g m n d m; d n S'; g' S' n d;", vishranti: "S g m - m g S;", source: "tanarang", url: T("raag-malkauns") },
  bilaskhanitodi: { ang: "S r ,n ,d S ; S r g ; r g P ; P d n d ; d m g r ; g r S ;", vishranti: "S; g; P; d; - d; P; g; S;", source: "tanarang", url: T("raag-bilaskhani-todi") },
  bhupaltodi: { ang: "S ,d S r g ; d P g r g r S;", vishranti: "S; g; P; d; - d; P; g; S;", source: "tanarang", url: T("raag-bhupal-todi") },
  bilawal: { ang: "G R G P ; D n D P ; m G R ; G P D N S' ;", vishranti: "S; G; P; - S'; P; G;", source: "tanarang", url: T("raag-alhaiya-bilawal") },
  devgiri: { ang: "S ; ,D ,N ,D S R G ; G R S ; ,D ,P G ; ,N R G m G ; G P m ; G R S ;", vishranti: "S; G; P; - P; G; S';", source: "tanarang", url: T("raag-devgiri-bilawal") },
  khamaj: { ang: "G m P D; G m G; P S' N S'; n D P; m P m G; R S;", vishranti: "S m P - S' P G;", source: "tanarang", url: T("raag-khamaj") },
  kalavati: { ang: "S G P D ; P D n D ; D P ; G P D S' n ; D n S' ; n P ; D G ; P G S ; ,n ,D S ;", vishranti: "G D - D G;", source: "tanarang", url: T("raag-kalawati") },
  jinjhoti: { ang: ",D S R m G ; R G S R ,n ,D ,P ,D S ; ,P ,D S R G m G ; m G R S ; R ,n ,D S ;", vishranti: "S; P; D; - S'; P; G;", source: "tanarang", url: T("raag-jhinjhoti") },
  rageshree: { ang: ",n ,D ,n S ; G m R S ; G m D n D m ; G m R S;", vishranti: "G; m; D;", source: "tanarang", url: T("raag-rageshree") },
  todi: { ang: ",d ; ,N S r g ; M r g ; r S;", vishranti: "S; g; d; - d; g; S;", source: "tanarang", url: T("raag-todi") },
  multani: { ang: ",N S ; M g ; M g P ; M g M g r S ;", vishranti: "S; g; P; N; - N; P; g; S;", source: "tanarang", url: T("raag-multani") },
  marwa: { ang: "S ; ,N ,D S ,N r ; r G M D ; D M G r ; ,N ,D r S ;", vishranti: "r; D; - D; r;", source: "tanarang", url: T("raag-marwa") },
  puriya: { ang: ",N r G ; G M D G M G ; N M G ; G M G r S ; ,N ,M ,D S ; ,N r G r S ;", vishranti: "G; N; - N; G;", source: "tanarang", url: T("raag-puriya") },
  poorvi: { ang: "S r G ; M G m G ; M d P ; N d P ; G M P ; M G m G r S ;", vishranti: "S; G; P; N; - S'; P; G;", source: "tanarang", url: T("raag-poorvi") },
  shreeraag: { ang: "S ,N r ; r r P ; M P d M G r G r S ; M P N S' r' ; r' N d P ; M d M G r ; G r S ;", vishranti: "S; r; P; - P; r; S;", source: "tanarang", url: T("raag-shree") },
  puriya_dhanashree: { ang: ",N r G M P ; P M G M r G ; M d P ; M d N S'; N r' ; N d P ; P d P P M G M r G ; r S;", vishranti: "S; G; P; N; - S'; P; G; r;", source: "tanarang", url: T("raag-puriya-dhanashree") },
  // not on tanarang.com in the form used here: the app's own notes
  kalingada: { ang: "d P G m G ; r S ,N S", vishranti: "S; G; P;", source: "app" },
  anandbhairav: { ang: "G m P D ; P m G r S", vishranti: "S; m; P;", source: "app" },
  asavari: { ang: "R m P d ; m P g R S", vishranti: "S; P; d;", source: "app" },
  dhanashree: { ang: ",n S g m P ; n D P ; m g R S", vishranti: "S; P;", source: "app" },
};

/** Convert one site-notation token to app notation (",N" -> "N,"; typographic ' -> '; drop kan "(x)"). */
function convertToken(tok: string): string[] {
  const t = tok.replace(/\([^)]*\)/g, "").replace(/[’‘]/g, "'").trim();
  if (!t) return [];
  const out: string[] = [];
  // a token may hold several swaras written together ("RG", "mP", "Pd")
  const re = /(,*)([SrRgGmMPdDnNp])('*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const letter = m[2] === "p" ? "P" : m[2]; // site typo: lowercase p
    out.push(letter + ",".repeat(m[1].length) + m[3]);
  }
  return out;
}

/** The mukhya ang as playable phrases in app notation. */
export function angPhrases(raagId: string): string[] {
  const e = MUKHYA_ANG[raagId];
  if (!e) return [];
  return e.ang.split(";").map(ph => ph.trim().split(/\s+/).flatMap(convertToken).join(" ")).filter(Boolean);
}

export function vishrantiSwaras(raagId: string): string[] {
  const e = MUKHYA_ANG[raagId];
  if (!e) return [];
  return [...new Set(e.vishranti.split(/[;\s-]+/).flatMap(convertToken))];
}
