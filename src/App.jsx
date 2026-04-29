import React, { useCallback, useEffect, useState } from 'react';
import styles from './App.module.css';

// --- CONFIGURATION ---
const APP_NAME = "NDAOBA MOHAMAT 24G2687"; 
// REMPLACE CETTE URL PAR TON LIEN RENDER RÉEL :
const API_BASE = "https://ton-projet-backend.onrender.com/api"; 

function Header({ language, setLanguage, appTheme, toggleTheme }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.brandBlock}>
          <div className={styles.logoAnimated}>🌍</div>
          <div>
            <h1 className={styles.brand}>
              {APP_NAME.split('').map((char, i) => (
                <span key={i} className={styles.brandChar} style={{ animationDelay: `${i * 0.05}s` }}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </h1>
            <p className={styles.subtitle}>Veille mondiale · Pollution 2025-2026</p>
          </div>
        </div>
        <div className={styles.controls}>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={styles.languageSelect}>
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
          <button onClick={toggleTheme} className={styles.themeButton}>{appTheme === 'dark' ? '☀️' : '🌙'}</button>
        </div>
      </div>
    </header>
  );
}

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('fr');
  const [appTheme, setAppTheme] = useState('dark');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/articles`);
      if (!response.ok) throw new Error('Serveur injoignable');
      const data = await response.json();
      setArticles(data.articles || []);
      setError(null);
    } catch (err) {
      setError("Connexion au serveur impossible. Vérifiez Render.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    document.documentElement.setAttribute('data-theme', appTheme);
  }, [fetchData, appTheme]);

  return (
    <div className={styles.app}>
      <Header language={language} setLanguage={setLanguage} appTheme={appTheme} toggleTheme={() => setAppTheme(appTheme === 'dark' ? 'light' : 'dark')} />
      
      <main className={styles.container}>
        {loading && <div className={styles.loader}>Chargement des données...</div>}
        {error && <div className={styles.errorBanner}>{error}</div>}
        
        <div className={styles.grid}>
          {articles.map(article => (
            <div key={article.id} className={styles.card}>
              <span className={styles.badge}>{article.niveau}</span>
              <h3>{article.titre}</h3>
              <p>{article.description}</p>
              <div className={styles.cardFooter}>
                <span>📍 {article.pays}</span>
                <span>📅 {new Date(article.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
