import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

type ContentRecord = Record<string, unknown>;
type ContentPath = (string | number)[];
type NewFieldKind = 'text' | 'longText' | 'number' | 'toggle' | 'list' | 'group';

interface StructuredContentEditorProps {
  value: ContentRecord;
  onChange: (value: ContentRecord) => void;
}

const humanize = (value: string) => value
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, character => character.toUpperCase());

const setAtPath = (root: ContentRecord, path: ContentPath, value: unknown): ContentRecord => {
  const update = (node: unknown, depth: number): unknown => {
    if (depth === path.length) return value;
    const part = path[depth];
    if (Array.isArray(node)) {
      const index = Number(part);
      const copy = [...node];
      copy[index] = update(node[index], depth + 1);
      return copy;
    }
    const record = node && typeof node === 'object' ? node as ContentRecord : {};
    const key = String(part);
    return { ...record, [key]: update(record[key], depth + 1) };
  };
  return update(root, 0) as ContentRecord;
};

const blankLike = (value: unknown): unknown => {
  if (typeof value === 'string') return '';
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, blankLike(item)]));
  return '';
};

const defaultItem = (key: string, items: unknown[]): unknown => {
  if (items[0] !== undefined) return blankLike(items[0]);
  const examples: Record<string, ContentRecord> = {
    team: { name: '', role: '', location: '', bio: '' },
    coreValues: { title: '', desc: '' },
    objectives: { title: '', description: '' },
    milestones: { title: '', dueDate: '', completed: false },
    faqs: { question: '', answer: '' },
    items: { title: '', description: '' },
    hubs: { name: '', description: '' }
  };
  return examples[key] ? { ...examples[key] } : '';
};

const newFieldValue = (kind: NewFieldKind): unknown => {
  if (kind === 'number') return 0;
  if (kind === 'toggle') return false;
  if (kind === 'list') return [];
  if (kind === 'group') return {};
  return '';
};

const AddField: React.FC<{ onAdd: (label: string, kind: NewFieldKind) => void }> = ({ onAdd }) => {
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<NewFieldKind>('text');
  return <form className="flex flex-wrap gap-2 border-t border-slate-800 pt-3" onSubmit={event => { event.preventDefault(); if (!label.trim()) return; onAdd(label.trim(), kind); setLabel(''); }}>
    <input value={label} onChange={event => setLabel(event.target.value)} placeholder="Add an information field" aria-label="New field label" className="min-w-40 flex-1 rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-500" />
    <select value={kind} onChange={event => setKind(event.target.value as NewFieldKind)} aria-label="New field type" className="rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white">
      <option value="text">Short text</option><option value="longText">Long text</option><option value="number">Number</option><option value="toggle">Yes / No</option><option value="list">List</option><option value="group">Group</option>
    </select>
    <button className="inline-flex items-center gap-1 rounded bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-600"><Plus className="h-3.5 w-3.5" />Add</button>
  </form>;
};

const ValueEditor: React.FC<{
  label: string;
  value: unknown;
  path: ContentPath;
  root: ContentRecord;
  onChange: (value: ContentRecord) => void;
  onRemove?: () => void;
}> = ({ label, value, path, root, onChange, onRemove }) => {
  const update = (next: unknown) => onChange(setAtPath(root, path, next));
  const isLongText = /description|summary|biography|content|body|message|statement|objectives/i.test(label);

  if (Array.isArray(value)) {
    return <fieldset className="space-y-2 rounded-lg border border-slate-800 p-3">
      <div className="flex items-center justify-between gap-2"><legend className="text-[11px] font-bold text-slate-300">{label}</legend>{onRemove && <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="rounded p-1 text-slate-500 hover:bg-rose-950 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>}</div>
      {value.map((item, index) => <div key={index} className="flex items-start gap-2 rounded border border-slate-800/80 p-2">
        <div className="min-w-0 flex-1"><ValueEditor label={`${label} item ${index + 1}`} value={item} path={[...path, index]} root={root} onChange={onChange} /></div>
        <button type="button" onClick={() => update(value.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${label} item ${index + 1}`} className="mt-1 rounded p-1 text-slate-500 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>)}
      <button type="button" onClick={() => update([...value, defaultItem(String(path.at(-1) ?? label), value)])} className="inline-flex items-center gap-1 rounded border border-slate-700 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-800"><Plus className="h-3 w-3" />Add item</button>
    </fieldset>;
  }

  if (value && typeof value === 'object') {
    const record = value as ContentRecord;
    return <fieldset className="space-y-2 rounded-lg border border-slate-800 p-3">
      <div className="flex items-center justify-between gap-2"><legend className="text-[11px] font-bold text-slate-300">{label}</legend>{onRemove && <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="rounded p-1 text-slate-500 hover:bg-rose-950 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>}</div>
      {Object.entries(record).map(([key, child]) => <ValueEditor key={key} label={humanize(key)} value={child} path={[...path, key]} root={root} onChange={onChange} onRemove={() => { const next = { ...record }; delete next[key]; update(next); }} />)}
      <AddField onAdd={(fieldLabel, kind) => {
        const base = fieldLabel.toLowerCase().trim().replace(/[^a-z0-9]+(.)/g, (_match, next: string) => next.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
        if (!base) return;
        let key = base.charAt(0).toLowerCase() + base.slice(1);
        let suffix = 2;
        while (Object.hasOwn(record, key)) key = `${base}${suffix++}`;
        update({ ...record, [key]: newFieldValue(kind) });
      }} />
    </fieldset>;
  }

  return <label className="block space-y-1 text-[11px] font-semibold text-slate-300">
    <span>{label}</span>
    <div className="flex items-start gap-2">
      {typeof value === 'boolean'
        ? <input type="checkbox" checked={value} onChange={event => update(event.target.checked)} className="mt-1 h-4 w-4 accent-cyan-600" />
        : typeof value === 'number'
          ? <input type="number" value={value} onChange={event => update(Number(event.target.value))} className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" />
          : isLongText
            ? <textarea value={typeof value === 'string' ? value : ''} onChange={event => update(event.target.value)} rows={3} className="w-full resize-y rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs font-normal text-white" />
            : <input type={/url|image|video|link|logo/i.test(label) ? 'url' : 'text'} value={typeof value === 'string' ? value : ''} onChange={event => update(event.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs font-normal text-white" />}
      {onRemove && <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="rounded p-1 text-slate-500 hover:bg-rose-950 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>}
    </div>
  </label>;
};

export const StructuredContentEditor: React.FC<StructuredContentEditorProps> = ({ value, onChange }) => (
  <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
    <div><h4 className="text-xs font-bold text-white">Content details</h4><p className="mt-1 text-[10px] text-slate-400">Add and edit information using fields. No code is needed.</p></div>
    <div className="space-y-3">{Object.entries(value).map(([key, fieldValue]) => <ValueEditor key={key} label={humanize(key)} value={fieldValue} path={[key]} root={value} onChange={onChange} onRemove={() => { const next = { ...value }; delete next[key]; onChange(next); }} />)}</div>
    <AddField onAdd={(fieldLabel, kind) => {
      const base = fieldLabel.toLowerCase().trim().replace(/[^a-z0-9]+(.)/g, (_match, next: string) => next.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
      if (!base) return;
      let key = base.charAt(0).toLowerCase() + base.slice(1);
      let suffix = 2;
      while (Object.hasOwn(value, key)) key = `${base}${suffix++}`;
      onChange({ ...value, [key]: newFieldValue(kind) });
    }} />
  </div>
);