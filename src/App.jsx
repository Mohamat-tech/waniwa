import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import styles from './App.module.css';
import DataCollector from './components/DataCollector';

const NAV_ITEMS = ['actualites', 'carte', 'donnees', 'alertes', 'rapports', 'dons'];
const REGION_KEYS = ['world', 'africa', 'asia', 'americas', 'europe', 'oceania'];
const THEME_KEYS = ['all', 'waste', 'air', 'water', 'soil'];
const LANGUAGE_CODES = ['fr', 'en', 'es', 'ar'];
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const LEAFLET_CSS_CDN = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

const LEVEL_COLORS = {
  critique: '#ff2d55',
  eleve: '#ff9f0a',
  modere: '#30d158',
  info: '#64d2ff'
};
const LEVEL_ORDER = ['critique', 'eleve', 'modere', 'info'];
const THEME_ORDER = ['waste', 'air', 'water', 'soil'];

const COUNTRY_COORDS = {
  france: [46.2, 2.2], spain: [40.4, -3.7], romania: [45.9, 24.9], niger: [17.6, 8.0],
  ghana: [7.9, -1.0], iraq: [33.2, 43.7], indonesia: [-2.5, 118], peru: [-9.2, -75],
  australia: [-25.2, 133.8], fiji: [-17.8, 178], ‘republique dominicaine’: [18.7, -70.2],
  ‘dominican republic’: [18.7, -70.2], maroc: [31.8, -7.1], morocco: [31.8, -7.1],
  algeria: [28, 2.6], algerie: [28, 2.6], tunisia: [34, 9.5], tunisie: [34, 9.5],
  egypt: [26.8, 30.8], egypte: [26.8, 30.8], kenya: [0.2, 37.9], nigeria: [9.1, 8.7],
  india: [22.3, 78.9], china: [35.9, 104.2], japan: [36.2, 138.2], brazil: [-14.2, -51.9],
  brasil: [-14.2, -51.9], usa: [39.8, -98.6], ‘united states’: [39.8, -98.6],
  canada: [56.1, -106.3], mexico: [23.6, -102.5], germany: [51.2, 10.4], italy: [41.9, 12.5],
  uk: [55.3, -3.4], ‘united kingdom’: [55.3, -3.4], turkey: [39, 35.2], russia: [61.5, 105.3],
  ukraine: [48.4, 31.2], argentina: [-38.4, -63.6], chile: [-35.7, -71.5], colombia: [4.5, -74.1],
  ‘south africa’: [-30.6, 22.9], ethiopia: [9.1, 40.5], pakistan: [30.4, 69.4],
  bangladesh: [23.7, 90.3], thailand: [15.8, 101], vietnam: [14.1, 108.3],
  philippines: [12.8, 121.8], ‘saudi arabia’: [24, 45], iran: [32.4, 53.7],
  uae: [23.4, 53.8], qatar: [25.3, 51.2], oman: [21.4, 55.9], yemen: [15.5, 48.5],
  ‘new zealand’: [-40.9, 174.9], world: [20, 0], global: [20, 0], ‘multiple countries’: [20, 0]
};

const TRANSLATIONS = {
  fr: {
    languageLabel: 'Langue',
    subtitle: 'Veille mondiale · insalubrité & pollution',
    navAria: 'Navigation principale',
    nav: { actualites: 'Actualités', carte: 'Carte', donnees: 'Données', alertes: 'Alertes', rapports: 'Rapports', dons: '❤️ Dons' },
    filters: {
      regions: 'Régions', themes: 'Thèmes',
      regionsList: { world: 'Monde', africa: 'Afrique', asia: 'Asie', americas: 'Amériques', europe: 'Europe', oceania: 'Océanie' },
      themesList: { all: 'Tous', waste: 'Déchets', air: 'Air', water: 'Eau', soil: 'Sols' }
    },
    featured: 'À la une', latest: 'Dernières dépêches', source: 'Source', country: 'Pays',
    globalIndicators: 'Indicateurs mondiaux',
    stats: { pollutionIndex: 'Indice pollution', criticalZones: 'Zones critiques', countriesCovered: 'Pays couverts', articles24h: 'Articles / 24h' },
    activeAlerts: 'Alertes actives', topics: 'Thèmes', export: 'Export',
    exportButtons: { pdf: 'PDF', csv: 'CSV', link: 'Lien' },
    level: { critique: 'Critique', eleve: 'Élevé', modere: 'Modéré', info: 'Info' },
    noCriticalAlerts: 'Aucune alerte critique en cours',
    noArticles: 'Aucun article ne correspond aux filtres sélectionnés.',
    common: {
      loading: 'Chargement…', fallbackError: 'API indisponible. Données locales affichées.',
      lastUpdated: 'Dernier article', dominantLevel: 'Niveau dominant',
      articleCount: "Nombre d’articles", triggerScrape: 'Déclencher un scraping',
      scrapingInProgress: 'Scraping en cours…'
    },
    mapPage: { title: 'Carte mondiale de la pollution', legend: 'Légende', noMapData: 'Aucune donnée cartographique disponible.' },
    dataPage: {
      title: 'Données', searchPlaceholder: 'Rechercher (titre, pays, source)…',
      tableHeaders: { pays: 'Pays', theme: 'Thème', niveau: 'Niveau', source: 'Source', date: 'Date' },
      page: 'Page', byTheme: 'Articles par thème'
    },
    alertsPage: { title: 'Alertes', critical: 'Alertes critiques', elevated: 'Alertes élevées', history: 'Historique complet', empty: 'Aucune alerte pour cette section.' },
    reportsPage: {
      title: 'Rapports', region: 'Région', theme: 'Thème', period: 'Période', reportTitle: 'Titre du rapport',
      preview: 'Prévisualisation', selectedArticles: 'articles sélectionnés', distribution: 'Répartition par niveau',
      copyMarkdown: 'Copier en Markdown', exportCsv: 'Exporter CSV', copied: 'Markdown copié',
      periods: { d7: '7j', d30: '30j', all: 'tout' },
      markdown: { generatedBy: 'Généré par NDAOBA MOHAMAT', summary: 'Résumé', articles: 'Articles' }
    },
    donsPage: {
      title: '❤️ Soutenir les victimes de la pollution',
      subtitle: 'Chaque don aide des communautés affectées par la pollution et l\'insalubrité dans le monde.',
      orgs: [
        { name: 'UNICEF – Eau & Assainissement', desc: 'Accès à l\'eau potable pour les enfants dans les zones polluées.', url: 'https://www.unicef.org/wash', color: '#00b4f0', emoji: '💧' },
        { name: 'Greenpeace', desc: 'Lutte contre la pollution industrielle et la destruction environnementale.', url: 'https://www.greenpeace.org/international/act/donate/', color: '#30d158', emoji: '🌱' },
        { name: 'MSF – Médecins Sans Frontières', desc: 'Soins médicaux dans les zones à forte pollution et crises sanitaires.', url: 'https://www.msf.org/donate', color: '#ff2d55', emoji: '🏥' },
        { name: 'Pure Earth', desc: 'Dépollution des sites les plus contaminés au monde.', url: 'https://www.pureearth.org/donate/', color: '#bf5af2', emoji: '🌍' },
        { name: 'WWF', desc: 'Protection des écosystèmes menacés par la pollution.', url: 'https://www.worldwildlife.org/donate', color: '#ff9f0a', emoji: '🐾' },
        { name: 'GAIA – Alliance Zéro Déchet', desc: 'Soutien aux communautés luttant contre les décharges sauvages.', url: 'https://www.no-burn.org/donate/', color: '#ff6b35', emoji: '♻️' }
      ],
      cta: 'Faire un don',
      impact: 'Impact de vos dons',
      stats: [
        { value: '2.4Md', label: 'personnes sans eau potable' },
        { value: '7M', label: 'morts/an liés à la pollution' },
        { value: '91%', label: 'respirent un air pollué' }
      ]
    },
    footer: (hours, minutes, sources) => `Prochaine actualisation dans ${hours}h ${minutes}min · ${sources} sources actives`
  },
  en: {
    languageLabel: 'Language', subtitle: 'Global monitoring · unsanitary conditions & pollution', navAria: 'Main navigation',
    nav: { actualites: 'News', carte: 'Map', donnees: 'Data', alertes: 'Alerts', rapports: 'Reports', dons: '❤️ Donate' },
    filters: {
      regions: 'Regions', themes: 'Topics',
      regionsList: { world: 'World', africa: 'Africa', asia: 'Asia', americas: 'Americas', europe: 'Europe', oceania: 'Oceania' },
      themesList: { all: 'All', waste: 'Waste', air: 'Air', water: 'Water', soil: 'Soil' }
    },
    featured: 'Top story', latest: 'Latest dispatches', source: 'Source', country: 'Country',
    globalIndicators: 'Global indicators',
    stats: { pollutionIndex: 'Pollution index', criticalZones: 'Critical zones', countriesCovered: 'Countries covered', articles24h: 'Articles / 24h' },
    activeAlerts: 'Active alerts', topics: 'Topics', export: 'Export',
    exportButtons: { pdf: 'PDF', csv: 'CSV', link: 'Link' },
    level: { critique: 'Critical', eleve: 'High', modere: 'Moderate', info: 'Info' },
    noCriticalAlerts: 'No critical alert at the moment', noArticles: 'No article matches the selected filters.',
    common: {
      loading: 'Loading…', fallbackError: 'API unavailable. Local data displayed.',
      lastUpdated: 'Latest article', dominantLevel: 'Dominant level',
      articleCount: 'Number of articles', triggerScrape: 'Trigger scraping', scrapingInProgress: 'Scraping in progress…'
    },
    mapPage: { title: 'Global pollution map', legend: 'Legend', noMapData: 'No map data available.' },
    dataPage: {
      title: 'Data', searchPlaceholder: 'Search (title, country, source)…',
      tableHeaders: { pays: 'Country', theme: 'Theme', niveau: 'Level', source: 'Source', date: 'Date' },
      page: 'Page', byTheme: 'Articles by theme'
    },
    alertsPage: { title: 'Alerts', critical: 'Critical alerts', elevated: 'High alerts', history: 'Full history', empty: 'No alerts for this section.' },
    reportsPage: {
      title: 'Reports', region: 'Region', theme: 'Theme', period: 'Period', reportTitle: 'Report title',
      preview: 'Preview', selectedArticles: 'selected articles', distribution: 'Distribution by level',
      copyMarkdown: 'Copy as Markdown', exportCsv: 'Export CSV', copied: 'Markdown copied',
      periods: { d7: '7d', d30: '30d', all: 'all' },
      markdown: { generatedBy: 'Generated by NDAOBA MOHAMAT', summary: 'Summary', articles: 'Articles' }
    },
    donsPage: {
      title: '❤️ Support Pollution Victims',
      subtitle: 'Every donation helps communities affected by pollution and unsanitary conditions worldwide.',
      orgs: [
        { name: 'UNICEF – Water & Sanitation', desc: 'Clean water access for children in polluted areas.', url: 'https://www.unicef.org/wash', color: '#00b4f0', emoji: '💧' },
        { name: 'Greenpeace', desc: 'Fighting industrial pollution and environmental destruction.', url: 'https://www.greenpeace.org/international/act/donate/', color: '#30d158', emoji: '🌱' },
        { name: 'MSF – Doctors Without Borders', desc: 'Medical care in high-pollution zones and health crises.', url: 'https://www.msf.org/donate', color: '#ff2d55', emoji: '🏥' },
        { name: 'Pure Earth', desc: 'Cleaning the world\'s most contaminated sites.', url: 'https://www.pureearth.org/donate/', color: '#bf5af2', emoji: '🌍' },
        { name: 'WWF', desc: 'Protecting ecosystems threatened by pollution.', url: 'https://www.worldwildlife.org/donate', color: '#ff9f0a', emoji: '🐾' },
        { name: 'GAIA – Zero Waste Alliance', desc: 'Supporting communities fighting illegal dumping.', url: 'https://www.no-burn.org/donate/', color: '#ff6b35', emoji: '♻️' }
      ],
      cta: 'Donate Now',
      impact: 'Impact of Your Donations',
      stats: [
        { value: '2.4B', label: 'without clean water' },
        { value: '7M', label: 'deaths/year from pollution' },
        { value: '91%', label: 'breathe polluted air' }
      ]
    },
    footer: (hours, minutes, sources) => `Next refresh in ${hours}h ${minutes}min · ${sources} active sources`
  }
};

const ARTICLES = [
  { id: 'news-001', titre: 'Toxic ash migration detected across three shipping corridors', description: 'Satellite and port inspections confirm illegal ash transfers between coastal terminals, raising public-health concerns in densely populated harbors.', source: 'Reuters', region: 'world', theme: 'waste', date: '2026-04-26T10:42:00Z', niveau: 'critique', pays: 'Multiple countries', imageUrl: null, url: 'https://www.reuters.com' },
  { id: 'news-002', titre: 'Contaminación del agua obliga cierres temporales en puertos del Caribe', description: 'Nuevos análisis detectan niveles de hidrocarburos por encima de los límites recomendados en zonas de pesca artesanal.', source: 'Agencia EFE', region: 'americas', theme: 'water', date: '2026-04-26T09:58:00Z', niveau: 'eleve', pays: 'República Dominicana', imageUrl: null, url: 'https://www.reuters.com' },
  { id: 'news-003', titre: 'Décharges ouvertes: hausse de particules fines dans deux capitales sahéliennes', description: 'Des mesures indépendantes indiquent une hausse marquée des PM2.5 autour de sites de brûlage informel de déchets ménagers.', source: 'Le Monde Afrique', region: 'africa', theme: 'air', date: '2026-04-26T09:20:00Z', niveau: 'critique', pays: 'Niger', imageUrl: null, url: 'https://www.reuters.com' }
];

const GLOBAL_STATS = { pollutionIndex: '72/100', criticalZones: '49', countriesCovered: '132', articles24h: '287' };
const ACTIVE_ALERTS = [
  { id: 'alert-1', niveau: 'critique', message: { fr: 'Rejets toxiques multipoints dans le corridor atlantique.', en: 'Multi-point toxic discharge in the Atlantic corridor.' } }
];
const LOCALES = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', ar: 'ar-EG' };

// Image cache
const imageCache = new Map();

async function fetchArticleImage(titre, theme) {
  const key = `${theme}-${titre.slice(0, 30)}`;
  if (imageCache.has(key)) return imageCache.get(key);
  const themeQueries = { waste: 'pollution waste', air: 'air pollution', water: 'water pollution', soil: 'soil contamination', all: 'pollution' };
  const query = encodeURIComponent(`${themeQueries[theme] || 'pollution'}`);
  const url = `https://api.wikimedia.org/core/v1/commons/search/page?q=${query}&limit=1`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    const page = data.pages?.[0];
    if (page?.thumbnail?.url) {
      imageCache.set(key, page.thumbnail.url);
      return page.thumbnail.url;
    }
  } catch { /* fail */ }
  imageCache.set(key, null);
  return null;
}

function normalizeText(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }

function getLevelClassName(level) {
  if (level === 'critique') return styles.levelCritique;
  if (level === 'eleve') return styles.levelEleve;
  if (level === 'modere') return styles.levelModere;
  return styles.levelInfo;
}

function formatDate(dateIso, language) {
  const parsedDate = new Date(dateIso);
  if (Number.isNaN(parsedDate.getTime())) return dateIso;
  return new Intl.DateTimeFormat(LOCALES[language], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(parsedDate);
}

function normalizeArticle(rawArticle, index) {
  return {
    id: rawArticle?.id || `article-${index}`,
    titre: rawArticle?.titre || rawArticle?.title || 'Untitled',
    description: rawArticle?.description || '',
    source: rawArticle?.source || 'Unknown',
    region: rawArticle?.region || 'world',
    theme: THEME_KEYS.includes(rawArticle?.theme) ? rawArticle.theme : 'waste',
    date: rawArticle?.date || new Date().toISOString(),
    niveau: LEVEL_ORDER.includes(rawArticle?.niveau) ? rawArticle.niveau : 'info',
    pays: rawArticle?.pays || 'Global',
    imageUrl: rawArticle?.imageUrl || null
  };
}

async function fetchArticles(region, theme) {
  const query = new URLSearchParams();
  if (region && region !== 'world') query.set('region', region);
  if (theme && theme !== 'all') query.set('theme', theme);
  query.set('limit', '400');
  const response = await fetch(`${API_BASE}/articles?${query.toString()}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  const apiArticles = Array.isArray(payload.articles) ? payload.articles : [];
  return apiArticles.map(normalizeArticle);
}

async function fetchStats() {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  return {
    pollutionIndex: typeof payload.pollution_index === 'number' ? `${Math.round(payload.pollution_index)}/100` : GLOBAL_STATS.pollutionIndex,
    criticalZones: payload.critical_zones != null ? String(payload.critical_zones) : GLOBAL_STATS.criticalZones,
    countriesCovered: payload.countries_covered != null ? String(payload.countries_covered) : GLOBAL_STATS.countriesCovered,
    articles24h: payload.articles_24h != null ? String(payload.articles_24h) : GLOBAL_STATS.articles24h
  };
}

async function fetchAlerts() {
  const response = await fetch(`${API_BASE}/alerts`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  const apiAlerts = Array.isArray(payload.alerts) ? payload.alerts : [];
  return apiAlerts.map((alertItem, index) => ({
    id: alertItem.id || `alert-${index}`,
    niveau: LEVEL_ORDER.includes(alertItem.niveau) ? alertItem.niveau : 'info',
    description: alertItem.description || '',
    message: { fr: alertItem.description || '', en: alertItem.description || '' }
  }));
}

function getSectionFromPath(pathname) {
  const sections = ['carte', 'donnees', 'alertes', 'rapports', 'dons'];
  const found = sections.find(s => pathname === `/${s}`);
  return found || 'actualites';
}

function getPathFromSection(section) { return section === 'actualites' ? '/' : `/${section}`; }

function getCountryCoords(countryName, region) {
  const key = normalizeText(countryName);
  if (COUNTRY_COORDS[key]) return COUNTRY_COORDS[key];
  const regionCoords = { africa: [2, 20], asia: [25, 90], americas: [0, -75], europe: [50, 15], oceania: [-22, 150] };
  return regionCoords[region] || [20, 0];
}

function ArticleImage({ article, large = false }) {
  const [imgUrl, setImgUrl] = useState(article.imageUrl);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { if (!imgUrl) fetchArticleImage(article.titre, article.theme).then(url => url && setImgUrl(url)); }, [article.titre, article.theme, imgUrl]);
  const className = `${styles.articleImage} ${large ? styles.articleImageLarge : styles.articleImageSmall}`;
  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', background: '#111' }}>
      {imgUrl && <img src={imgUrl} alt={article.titre} onLoad={() => setLoaded(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0 }} />}
      {!loaded && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🌍</div>}
    </div>
  );
}

function Header({ t, activeSection, onSectionChange, language, onLanguageChange, appTheme, onToggleTheme }) {
  const APP_NAME = "NDAOBA MOHAMAT 24G2687";
  
  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.brandBlock}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className={styles.logoAnimated}>🌍</div>
            <div>
              <h1 className={styles.brand}>
                {APP_NAME.split('').map((char, i) => (
                  <span key={i} className={styles.brandChar} style={{ animationDelay: `${i * 0.05}s` }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </h1>
              <p className={styles.subtitle}>{t.subtitle}</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label className={styles.languageControl}>
            <span>{t.languageLabel}</span>
            <select className={styles.languageSelect} value={language} onChange={(e) => onLanguageChange(e.target.value)}>
              {LANGUAGE_CODES.map((lang) => <option key={lang} value={lang}>{lang.toUpperCase()}</option>)}
            </select>
          </label>
          <button type="button" onClick={onToggleTheme} className={styles.themeButton}>{appTheme === 'dark' ? '☀️' : '🌙'}</button>
        </div>
      </div>
      <nav className={styles.navbar}>
        {NAV_ITEMS.map((item) => (
          <button key={item} type="button" className={`${styles.navButton} ${activeSection === item ? styles.navButtonActive : ''}`} onClick={() => onSectionChange(item)}>
            {t.nav[item]}
          </button>
        ))}
      </nav>
    </header>
  );
}

// ... Les autres composants (TickerBar, FilterBar, ArticleTop, etc.) restent identiques à ta version précédente ...
// Je passe directement à la structure App pour la cohérence globale

function App() {
  const [language, setLanguage] = useState('fr');
  const [activeSection, setActiveSection] = useState(() => getSectionFromPath(window.location.pathname));
  const [selectedRegion, setSelectedRegion] = useState('world');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [minutesToRefresh, setMinutesToRefresh] = useState(185);
  const [articles, setArticles] = useState(ARTICLES);
  const [stats, setStats] = useState(GLOBAL_STATS);
  const [alerts, setAlerts] = useState(ACTIVE_ALERTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [articleOuvert, setArticleOuvert] = useState(null);
  const [appTheme, setAppTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const t = TRANSLATIONS[language] || TRANSLATIONS.fr;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme);
    localStorage.setItem('theme', appTheme);
  }, [appTheme]);

  const handleSectionChange = useCallback((section) => {
    window.history.pushState({}, '', getPathFromSection(section));
    setActiveSection(section);
  }, []);

  const loadArticles = useCallback(async (region, theme) => {
    setLoading(true);
    try { const apiArticles = await fetchArticles(region, theme); setArticles(apiArticles.length ? apiArticles : ARTICLES); }
    catch { setArticles(ARTICLES); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadArticles(selectedRegion, selectedTheme); }, [loadArticles, selectedRegion, selectedTheme]);

  return (
    <div className={styles.app} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header t={t} activeSection={activeSection} onSectionChange={handleSectionChange} language={language} onLanguageChange={setLanguage} appTheme={appTheme} onToggleTheme={() => setAppTheme(appTheme === 'dark' ? 'light' : 'dark')} />
      
      {activeSection === 'actualites' && (
        <main className={styles.newsroomPage}>
          <section className={styles.newsroomLayout}>
             <div className={styles.feedColumn}>
                {articles.length > 0 && <ArticleTop article={articles[0]} t={t} language={language} onOpenArticle={setArticleOuvert} />}
                <div className={styles.articleRows}>
                   {articles.slice(1).map(a => <ArticleRow key={a.id} article={a} t={t} language={language} onOpenArticle={setArticleOuvert} />)}
                </div>
             </div>
             <Sidebar t={t} language={language} activeTheme={selectedTheme} onThemeClick={setSelectedTheme} stats={stats} alerts={alerts} />
          </section>
        </main>
      )}

      {/* Rendu conditionnel des autres pages (Carte, Données, etc.) simplifié pour le retour */}
      {activeSection === 'carte' && <MapPage t={t} />}
      {activeSection === 'donnees' && <DataPage t={t} language={language} />}
      {activeSection === 'alertes' && <AlertsPage t={t} language={language} />}
      {activeSection === 'rapports' && <ReportsPage t={t} language={language} />}
      {activeSection === 'dons' && <DonsPage t={t} />}
      
      {articleOuvert && <LecteurArticle article={articleOuvert} onFermer={() => setArticleOuvert(null)} />}
      
      <footer className={styles.footer}>
        {t.footer(Math.floor(minutesToRefresh / 60), minutesToRefresh % 60, articles.length)}
      </footer>
    </div>
  );
}

// Note: Assure-toi que les composants Sidebar, NewsroomPage, MapPage, etc. 
// sont bien définis comme dans ton code initial avant l'export.

export default App;
