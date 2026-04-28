import React, { useState } from 'react';

export default function DataCollector({ visible, onClose }) {
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0,16)); // yyyy-mm-ddThh:mm
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('air');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  if (!visible) return null;

  const submit = async (ev) => {
    ev.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        timestamp: timestamp ? new Date(timestamp).toISOString() : undefined,
        source,
        category,
        value1: parseFloat(value1),
        value2: value2 ? parseFloat(value2) : null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        notes,
      };
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || res.statusText);
      }
      setMessage('Données envoyées avec succès.');
      setTimeout(() => { setMessage(null); onClose(); }, 900);
    } catch (e) {
      setMessage('Erreur: ' + (e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200}}>
      <form onSubmit={submit} style={{background:'var(--color-bg)', color:'var(--color-text)', padding:20, borderRadius:8, width:520, maxWidth:'95%', boxShadow:'0 6px 24px rgba(0,0,0,0.2)'}}>
        <h3>Collecte de données</h3>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
          <label>Horodatage<input type="datetime-local" value={timestamp} onChange={(e)=>setTimestamp(e.target.value)} required style={{width:'100%'}}/></label>
          <label>Source<input value={source} onChange={(e)=>setSource(e.target.value)} required style={{width:'100%'}}/></label>
          <label>Catégorie<select value={category} onChange={(e)=>setCategory(e.target.value)} style={{width:'100%'}}>
            <option value="air">Air</option>
            <option value="water">Water</option>
            <option value="soil">Soil</option>
            <option value="noise">Noise</option>
            <option value="other">Other</option>
          </select></label>
          <label>Valeur 1<input type="number" step="any" value={value1} onChange={(e)=>setValue1(e.target.value)} required style={{width:'100%'}}/></label>
          <label>Valeur 2<input type="number" step="any" value={value2} onChange={(e)=>setValue2(e.target.value)} style={{width:'100%'}}/></label>
          <label>Latitude<input type="number" step="any" value={lat} onChange={(e)=>setLat(e.target.value)} style={{width:'100%'}}/></label>
          <label>Longitude<input type="number" step="any" value={lng} onChange={(e)=>setLng(e.target.value)} style={{width:'100%'}}/></label>
          <label style={{gridColumn:'1 / -1'}}>Notes<textarea value={notes} onChange={(e)=>setNotes(e.target.value)} style={{width:'100%'}}/></label>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
          <button type="button" onClick={onClose} disabled={busy} style={{padding:'8px 12px'}}>Annuler</button>
          <button type="submit" disabled={busy} style={{padding:'8px 12px', background:'var(--color-primary)', color:'#fff', border:'none', borderRadius:6}}>{busy? 'Envoi...' : 'Envoyer'}</button>
        </div>
        {message && <div style={{marginTop:10}}>{message}</div>}
      </form>
    </div>
  );
}
