import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, LocateFixed, MapPin, Search } from 'lucide-react';
import { nodeById, nodes } from '../data/campusGraph';

export default function PlacePicker({ label, value, onChange, exclude, starting = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const trigger = useRef(null);
  const container = useRef(null);
  const id = useId();
  const matches = nodes.filter((node) => node.type !== 'path' && node.id !== exclude && node.name.toLowerCase().includes(query.trim().toLowerCase()));
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const outside = (event) => { if (!container.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return <div ref={container} className="place-picker" onKeyDown={(event) => { if (event.key === 'Escape' && open) { event.stopPropagation(); close(); } }}>
    <span id={`${id}-label`} className="field-label">{label}</span>
    <button ref={trigger} className="place-select" aria-labelledby={`${id}-label ${id}-value`} aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? `${id}-popup` : undefined} onClick={() => { setOpen(!open); setQuery(''); }}>
      {starting ? <LocateFixed size={17} /> : <MapPin size={17} />}<span id={`${id}-value`}>{nodeById[value]?.name || 'Choose a place'}</span><ChevronDown size={16} className={open ? 'rotate-180' : ''} />
    </button>
    {open && <div id={`${id}-popup`} className="picker-popup" role="dialog" aria-label={`Choose ${label.toLowerCase()}`}>
      <label className="picker-search"><Search size={16} /><input autoFocus aria-label={`Search ${label.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search campus places…" /></label>
      <div className="picker-results">{matches.length ? matches.map((node) => <button key={node.id} onClick={() => { onChange(node.id); close(); }} aria-pressed={value === node.id}><span><strong>{node.name}</strong><small>{({ entrance: 'Campus entrance', building: 'Campus building', plaza: 'Outdoor landmark', transport: 'Transport' })[node.type]}</small></span>{value === node.id && <Check size={15} />}</button>) : <p>No places match your search.</p>}</div>
    </div>}
  </div>;
}
