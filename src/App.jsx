import React, { useState, useMemo, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const noSelectStyle = `
  .no-select-all {
    -webkit-tap-highlight-color: transparent;
    user-select: none !important;
    -webkit-user-select: none !important;
    user-drag: none !important;
    -webkit-user-drag: none !important;
  }
  .no-select-all ::selection { background: transparent !important; }
`;

const CLASSES_DE_MOTS = [
  { nom: '', couleur: 'bg-gray-100 border-gray-300 text-slate-800' },
  { nom: 'Nom', couleur: 'bg-blue-100 border-blue-300 text-blue-900' },
  { nom: 'Verbe', couleur: 'bg-red-100 border-red-400 text-red-900' },
  { nom: 'Déterminant', couleur: 'bg-green-100 border-green-300 text-green-900' },
  { nom: 'Adjectif', couleur: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
  { nom: 'Pronom', couleur: 'bg-teal-100 border-teal-300 text-teal-900' },
  { nom: 'Préposition', couleur: 'bg-purple-100 border-purple-300 text-purple-900' },
  { nom: 'Adverbe', couleur: 'bg-pink-100 border-pink-300 text-pink-900' },
  { nom: 'Conjonction', couleur: 'bg-orange-100 border-orange-300 text-orange-900' },
];

const FONCTIONS = [
  { id: 'sujet', nom: 'Sujet', couleur: 'border-blue-400 bg-blue-50 text-blue-700', active: 'bg-blue-600 text-white border-blue-700', label: 'bg-blue-500' },
  { id: 'predicat', nom: 'Prédicat', couleur: 'border-red-400 bg-red-50 text-red-700', active: 'bg-red-600 text-white border-red-700', label: 'bg-red-500' },
  { id: 'cp', nom: 'CP', couleur: 'border-emerald-400 bg-emerald-50 text-emerald-700', active: 'bg-emerald-600 text-white border-emerald-700', label: 'bg-emerald-500' },
];

const PRONOMS_SUJET = ["Il", "Elle", "Ils", "Elles"];
const FORMES_DORMIR = ["dors", "dort", "dormons", "dormez", "dorment"];

// Fonction utilitaire pour gérer la casse (conserve les majuscules des noms propres)
const formaterMot = (texte, estLePremierMot) => {
  const net = texte.replace(/[.,]$/, "");
  if (!net) return "";
  if (estLePremierMot) {
    return net.charAt(0).toUpperCase() + net.slice(1);
  }
  const estMajusculeOriginale = net.charAt(0) === net.charAt(0).toUpperCase() && net.charAt(0) !== net.charAt(0).toLowerCase();
  return estMajusculeOriginale ? net : net.toLowerCase();
};

function SortableElement({ id, item, mode, selectionnes, toggleSelection, config, setManipulation, menuActif, setMenuActif, supprimerGroupe, changerClasseMots }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: id,
    disabled: item.type === 'groupe' && !!item.data.manip && item.data.manip !== 'effacement'
  });

  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 1, touchAction: 'none' };

  if (item.type === 'mot') {
    const affiche = formaterMot(item.data.texte, config.maj);
    const classeIdx = item.data.classeIndex || 0;

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}
        data-id={id}
        onClick={(e) => { e.stopPropagation(); mode === 'classes' ? changerClasseMots(id) : toggleSelection(id); }}
        className={`word-block relative px-4 py-3 mt-8 rounded-xl border-b-2 transition-all cursor-pointer no-select-all
          ${mode === 'classes' ? CLASSES_DE_MOTS[classeIdx].couleur : (selectionnes.includes(id) ? 'bg-yellow-200 border-yellow-500 scale-105 shadow-md ring-2 ring-yellow-400' : 'bg-white border-slate-200')}
          ${isDragging ? 'opacity-50 scale-105 rotate-2 shadow-2xl z-[100]' : ''}`}>
        <div className="text-2xl font-bold flex flex-col items-center whitespace-nowrap pointer-events-none">
          {affiche}{config.estDernier && "."}
          {mode === 'classes' && classeIdx > 0 && <span className="text-[10px] uppercase font-black opacity-60 mt-1">{CLASSES_DE_MOTS[classeIdx].nom}</span>}
        </div>
      </div>
    );
  }

  const f = FONCTIONS.find(fn => fn.id === item.data.fonctionId);
  const m = item.data.manip;

  return (
    <div ref={setNodeRef} style={style}
      className={`group relative flex flex-col items-center mt-8 p-5 border-4 border-dashed rounded-[3rem] transition-all ${f.couleur} no-select-all
      ${isDragging ? 'opacity-50 scale-105 rotate-1 shadow-2xl z-[100]' : ''} ${m === 'effacement' || m === 'remplacement' ? 'bg-slate-200/40 border-slate-300' : ''} ${m && m !== 'effacement' ? '' : 'cursor-grab'}`}>
      
      <div {...attributes} {...listeners} className="absolute inset-0 z-10" />

      {!m && <button onClick={(e) => { e.stopPropagation(); supprimerGroupe(id); }} className="absolute -top-3 -right-3 w-8 h-8 bg-white border-2 border-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold shadow-sm hover:bg-red-500 hover:text-white z-50 transition-all opacity-0 group-hover:opacity-100">✕</button>}

      {m === 'remplacement' && (
        <div className="absolute -top-12 z-40 flex items-center">
          <div className={`${f.label} text-white text-xl font-black px-6 py-2 rounded-2xl shadow-xl ring-4 ring-white min-w-[100px] text-center`}>
            {config.majPronom ? item.data.pronom?.charAt(0).toUpperCase() + item.data.pronom?.slice(1) : item.data.pronom?.toLowerCase()}
          </div>
          {config.estDernier && <span className="text-3xl font-black ml-2 -mb-2">.</span>}
        </div>
      )}

      {(m === 'singulier' || m === 'pluriel') && (
        <div className="absolute -top-12 left-[-1.5rem] right-[-1.5rem] flex justify-between z-40 pointer-events-none">
          <div className={`${f.label} text-white text-xl font-black px-5 py-2 rounded-2xl shadow-xl ring-4 ring-white`}>{config.majEtiquette ? (m === 'singulier' ? "C'est" : "Ce sont") : (m === 'singulier' ? "c'est" : "ce sont")}</div>
          <div className="flex items-center"><div className={`${f.label} text-white text-xl font-black px-5 py-2 rounded-2xl shadow-xl ring-4 ring-white`}>qui</div>{config.estDernier && <span className="text-3xl font-black ml-2 -mb-2">.</span>}</div>
        </div>
      )}

      {m === 'dedoublement' && <div className="absolute -top-12 z-40 text-center"><div className={`${f.label} text-white text-xl font-black px-6 py-2 rounded-2xl shadow-xl ring-4 ring-white whitespace-nowrap`}>et cela se passe</div></div>}

      <div className={`flex items-center gap-1 z-0 transition-all duration-300 ${m === 'effacement' || m === 'remplacement' ? 'opacity-10 grayscale' : 'opacity-100'}`}>
        {config.virguleAvant && <span className="text-2xl font-black mr-1">,</span>}
        <div className="flex gap-2">
            {item.data.motsDuGroupe.map((mot, idx) => {
              const doitEtreMaj = config.majMots && idx === 0 && !(m === 'singulier' || m === 'pluriel');
              const motFormate = formaterMot(mot.texte, doitEtreMaj);
              return <div key={mot.id} className="px-4 py-3 bg-white rounded-xl border-b-2 border-slate-200 text-2xl font-bold">{motFormate}</div>;
            })}
        </div>
        {config.virguleApres && <span className="text-2xl font-black ml-1">,</span>}
        {config.estDernier && (m === 'dedoublement' || !m) && <span className="text-2xl font-black ml-1">.</span>}
      </div>

      <div className="mt-4 flex flex-col items-center z-20">
        <span className="text-[10px] font-black uppercase opacity-40 mb-2">{f.nom}</span>
        <div className="flex gap-1">
          {f.id === 'sujet' && <button onClick={(e) => { e.stopPropagation(); setManipulation(id, m === 'singulier' ? null : 'singulier'); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-colors ${m === 'singulier' || m === 'pluriel' ? f.active : 'bg-white text-blue-600 border-blue-100'}`}>Encadrement</button>}
          {f.id === 'cp' && <button onClick={(e) => { e.stopPropagation(); setManipulation(id, m === 'dedoublement' ? null : 'dedoublement'); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-colors ${m === 'dedoublement' ? f.active : 'bg-white text-emerald-600 border-emerald-100'}`}>Dédoublement</button>}
          <button onClick={(e) => { e.stopPropagation(); setManipulation(id, m === 'effacement' ? null : 'effacement'); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-colors ${m === 'effacement' ? 'bg-slate-700 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-100'}`}>Effacement</button>
          {(f.id === 'sujet' || f.id === 'predicat') && <button onClick={(e) => { e.stopPropagation(); if (m === 'remplacement') setManipulation(id, null); else setMenuActif(menuActif.id === id ? {id:null} : {id}); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-colors ${m === 'remplacement' || menuActif.id === id ? f.active : 'bg-white text-slate-600 border-slate-100'}`}>Remplacement</button>}
        </div>
        {menuActif.id === id && (
          <div className="mt-2 flex flex-wrap gap-1 p-1.5 rounded-xl border bg-white shadow-md animate-in fade-in zoom-in-95 duration-200">
            {(f.id === 'sujet' ? PRONOMS_SUJET : FORMES_DORMIR).map(v => <button key={v} onClick={(e) => {e.stopPropagation(); setManipulation(id, 'remplacement', v); setMenuActif({id:null});}} className="px-2 py-1 bg-slate-50 rounded text-[9px] font-bold border hover:bg-indigo-100">{v}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [mots, setMots] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [phrase, setPhrase] = useState("");
  const [mode, setMode] = useState('classes');
  const [selectionnes, setSelectionnes] = useState([]);
  const [menuActif, setMenuActif] = useState({ id: null });
  const [lasso, setLasso] = useState({ active: false, start: { x: 0, y: 0 }, end: { x: 0, y: 0 } });
  const containerRef = useRef(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = itemsDeTri.findIndex((item) => item.id === active.id);
      const newIndex = itemsDeTri.findIndex((item) => item.id === over.id);
      const nouveauxItems = arrayMove(itemsDeTri, oldIndex, newIndex);
      
      const nouveauxMots = [];
      nouveauxItems.forEach(it => {
        if (it.type === 'mot') nouveauxMots.push(it.data);
        else nouveauxMots.push(...it.data.motsDuGroupe);
      });
      setMots(nouveauxMots);
    }
  };

  const generer = () => {
    if (!phrase.trim()) return;
    setMots(phrase.split(/\s+/).filter(t => t).map((t, i) => ({ 
      id: `m-${i}-${Date.now()}`, 
      originalIndex: i, 
      texte: t, 
      classeIndex: 0 
    })));
    setGroupes([]); 
    setSelectionnes([]);
    setMenuActif({ id: null });
  };

  const handleMouseDown = (e) => {
    if (mode !== 'groupes' || e.button !== 0 || e.target.closest('button') || e.target.closest('.word-block') || e.target.closest('.group')) return;
    const rect = containerRef.current.getBoundingClientRect();
    setLasso({ active: true, start: { x: e.clientX - rect.left, y: e.clientY - rect.top }, end: { x: e.clientX - rect.left, y: e.clientY - rect.top } });
    setSelectionnes([]);
  };

  const handleMouseMove = (e) => {
    if (!lasso.active) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    setLasso(prev => ({ ...prev, end: { x: currentX, y: currentY } }));
    const lassoRect = { left: Math.min(lasso.start.x, currentX) + rect.left, top: Math.min(lasso.start.y, currentY) + rect.top, right: Math.max(lasso.start.x, currentX) + rect.left, bottom: Math.max(lasso.start.y, currentY) + rect.top };
    const nouveauxSelectionnes = [];
    document.querySelectorAll('.word-block').forEach(el => {
      const elRect = el.getBoundingClientRect();
      if (!(elRect.left > lassoRect.right || elRect.right < lassoRect.left || elRect.top > lassoRect.bottom || elRect.bottom < lassoRect.top)) nouveauxSelectionnes.push(el.getAttribute('data-id'));
    });
    setSelectionnes(nouveauxSelectionnes);
  };

  const itemsDeTri = useMemo(() => {
    const items = []; let i = 0;
    while (i < mots.length) {
      const g = groupes.find(gr => gr.motIds.includes(mots[i].id));
      if (g && mode === 'groupes') {
        items.push({ id: g.id, type: 'groupe', data: { ...g, motsDuGroupe: mots.slice(i, i + g.motIds.length) } });
        i += g.motIds.length;
      } else { items.push({ id: mots[i].id, type: 'mot', data: mots[i] }); i++; }
    }
    return items;
  }, [mots, groupes, mode]);

  const configVisuelle = useMemo(() => {
    const configs = {};
    const visibleItems = itemsDeTri.filter(it => it.type === 'mot' || it.data.manip !== 'effacement');
    visibleItems.forEach((it, idx) => {
      const manip = it.type === 'groupe' ? it.data.manip : null;
      configs[it.id] = { 
          maj: idx === 0, 
          majEtiquette: idx === 0 && (manip === 'singulier' || manip === 'pluriel'), 
          majPronom: idx === 0 && manip === 'remplacement', 
          majMots: idx === 0 && (manip !== 'singulier' && manip !== 'pluriel' && manip !== 'remplacement'), 
          estDernier: idx === visibleItems.length - 1, 
          virguleAvant: it.type === 'groupe' && it.data.fonctionId === 'cp' && idx !== 0 && idx !== visibleItems.length - 1, 
          virguleApres: it.type === 'groupe' && it.data.fonctionId === 'cp' && idx !== visibleItems.length - 1 
      };
    });
    return configs;
  }, [itemsDeTri]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900 no-select-all" onSelectStart={(e) => e.preventDefault()}>
      <style>{noSelectStyle}</style>
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10"><h1 className="text-4xl font-black uppercase border-b-8 border-indigo-500 inline-block tracking-tighter italic">ANALYSE DE PHRASES</h1></header>
        <div className="flex justify-center mb-8">
            <div className="bg-white p-2 rounded-2xl border-2 flex gap-2 shadow-sm">
                <button onClick={() => setMode('classes')} className={`px-8 py-3 rounded-xl font-bold transition-all ${mode === 'classes' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>CLASSES</button>
                <button onClick={() => setMode('groupes')} className={`px-8 py-3 rounded-xl font-bold transition-all ${mode === 'groupes' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>CONSTITUANTS</button>
            </div>
        </div>
        <div className="flex gap-3 mb-10 bg-white p-4 rounded-3xl shadow-xl border-2">
            <input type="text" value={phrase} onChange={e => setPhrase(e.target.value)} onKeyDown={e => e.key === 'Enter' && generer()} placeholder="Saisir une phrase..." className="flex-1 p-2 text-xl outline-none font-medium" />
            <button onClick={generer} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-600 transition-colors shadow-lg">ANALYSER</button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div ref={containerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setLasso(p => ({...p, active:false}))} className={`relative p-20 bg-white rounded-[4rem] shadow-inner min-h-[450px] flex flex-wrap gap-x-8 gap-y-16 items-start justify-center border-4 border-dashed border-slate-100 ${mode === 'groupes' ? 'cursor-crosshair' : ''}`}>
            {lasso.active && <div className="absolute border-2 border-indigo-500 bg-indigo-500/10 rounded-sm pointer-events-none z-[1000]" style={{ left: Math.min(lasso.start.x, lasso.end.x), top: Math.min(lasso.start.y, lasso.end.y), width: Math.abs(lasso.start.x - lasso.end.x), height: Math.abs(lasso.start.y - lasso.end.y) }} />}
            <SortableContext items={itemsDeTri.map(i => i.id)} strategy={horizontalListSortingStrategy}>
              {itemsDeTri.map(it => (<SortableElement 
                key={it.id} 
                id={it.id} 
                item={it} 
                mode={mode} 
                selectionnes={selectionnes} 
                config={configVisuelle[it.id] || {}} 
                toggleSelection={id => setSelectionnes(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])} 
                setManipulation={(id, m, p=null) => setGroupes(groupes.map(g => g.id === id ? {...g, manip:m, pronom:p} : g))} 
                menuActif={menuActif} 
                setMenuActif={setMenuActif} 
                supprimerGroupe={id => setGroupes(groupes.filter(g => g.id !== id))} 
                changerClasseMots={id => setMots(mots.map(m => m.id === id ? { ...m, classeIndex: (m.classeIndex + 1) % CLASSES_DE_MOTS.length } : m))} 
              />))}
            </SortableContext>
          </div>
        </DndContext>

        {mode === 'groupes' && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex justify-center gap-3">
                {FONCTIONS.map(f => (<button key={f.id} onClick={() => { if (selectionnes.length === 0) return; setGroupes([...groupes.filter(gr => !gr.motIds.some(id => selectionnes.includes(id))), { id: `g-${Date.now()}`, motIds: [...selectionnes], fonctionId: f.id, manip: null, pronom: null }]); setSelectionnes([]); }} className={`px-6 py-3 rounded-xl border-2 font-black transition-all ${selectionnes.length > 0 ? f.couleur + ' border-current scale-105 shadow-md' : 'bg-gray-100 text-gray-300 border-gray-200 pointer-events-none'}`}>+ {f.nom}</button>))}
                <button onClick={generer} className="px-6 py-3 border-2 rounded-xl font-bold text-slate-500 hover:bg-white transition-all shadow-sm">Réinitialiser</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}