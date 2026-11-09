import React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react';
import { CmsMedia } from '../../common/CmsMedia';

type AboutPageContent = Record<string, unknown>;
type AboutItem = Record<string, string | undefined>;

interface AboutPageEditorProps {
  content: AboutPageContent;
  onChange: (content: AboutPageContent) => void;
  media: { id: string; originalName: string; title: string | null; contentType: string; previewUrl: string }[];
  onUpload: (file: File) => Promise<string | null>;
}

interface MediaInputProps {
  label: string;
  kind: 'image' | 'video';
  value: unknown;
  media: AboutPageEditorProps['media'];
  onChange: (url: string) => void;
  onUpload: AboutPageEditorProps['onUpload'];
}

const MediaInput: React.FC<MediaInputProps> = ({ label, kind, value, media, onChange, onUpload }) => {
  const [uploading, setUploading] = React.useState(false);
  const url = typeof value === 'string' ? value : '';
  const availableMedia = media.filter(asset => asset.contentType.startsWith(`${kind}/`));
  const assetId = url.match(/^\/api\/media\/([^/]+)\/public$/)?.[1];
  const previewUrl = media.find(asset => asset.id === assetId)?.previewUrl || url;

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploadedUrl = await onUpload(file);
      if (uploadedUrl) onChange(uploadedUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
          <Upload className="h-3.5 w-3.5" />{uploading ? 'Uploading…' : `Upload ${kind}`}
          <input type="file" accept={kind === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'} disabled={uploading} onChange={event => { void upload(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} className="sr-only" />
        </label>
      </div>
      {availableMedia.length > 0 && <select value={availableMedia.some(asset => url === `/api/media/${asset.id}/public`) ? url : ''} onChange={event => { const asset = availableMedia.find(item => event.target.value === `/api/media/${item.id}/public`); if (asset) onChange(`/api/media/${asset.id}/public`); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900">
        <option value="">Choose from media library</option>
        {availableMedia.map(asset => <option key={asset.id} value={`/api/media/${asset.id}/public`}>{asset.title || asset.originalName}</option>)}
      </select>}
      <input type="url" value={url.startsWith('/api/media/') ? '' : url} onChange={event => onChange(event.target.value)} placeholder={`Or enter a secure ${kind} URL`} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900" />
      {url && <CmsMedia src={previewUrl} kind={kind} alt={label} className="max-h-52 w-full rounded-lg object-contain" />}
    </div>
  );
};

const readObject = (value: unknown): AboutItem =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as AboutItem : {};

const readItems = (value: unknown): AboutItem[] =>
  Array.isArray(value) ? value.map(item => readObject(item)) : [];

export const AboutPageEditor: React.FC<AboutPageEditorProps> = ({ content, onChange, media, onUpload }) => {
  const setField = (section: string, key: string, value: string) => {
    onChange({ ...content, [section]: { ...readObject(content[section]), [key]: value } });
  };

  const setPageField = (key: string, value: string) => onChange({ ...content, [key]: value });

  const setItemField = (list: 'coreValues' | 'team' | 'additionalSections', index: number, key: string, value: string) => {
    const items = readItems(content[list]);
    items[index] = { ...items[index], [key]: value };
    onChange({ ...content, [list]: items });
  };

  const addItem = (list: 'coreValues' | 'team' | 'additionalSections') => {
    const items = readItems(content[list]);
    items.push(list === 'coreValues' ? { title: '', desc: '' } : list === 'team' ? { name: '', role: '', location: '', bio: '' } : { title: '', body: '' });
    onChange({ ...content, [list]: items });
  };

  const removeItem = (list: 'coreValues' | 'team' | 'additionalSections', index: number) => {
    onChange({ ...content, [list]: readItems(content[list]).filter((_, itemIndex) => itemIndex !== index) });
  };

  const moveItem = (list: 'coreValues' | 'team' | 'additionalSections', index: number, offset: -1 | 1) => {
    const items = readItems(content[list]);
    const target = index + offset;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    onChange({ ...content, [list]: items });
  };

  const input = (label: string, value: unknown, onValue: (next: string) => void, multiline = false) => (
    <label className="block space-y-1 text-xs font-semibold text-slate-700">
      <span>{label}</span>
      {multiline ? (
        <textarea value={typeof value === 'string' ? value : ''} onChange={event => onValue(event.target.value)} rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900" />
      ) : (
        <input value={typeof value === 'string' ? value : ''} onChange={event => onValue(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900" />
      )}
    </label>
  );

  const whoWeAre = readObject(content.whoWeAre);
  const vision = readObject(content.vision);
  const mission = readObject(content.mission);
  const banner = readObject(content.banner);
  const coreValues = readItems(content.coreValues);
  const team = readItems(content.team);
  const additionalSections = readItems(content.additionalSections);

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-5">
      <header className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900">About SiHub content</h2>
        <p className="mt-1 text-sm text-slate-600">Edit the existing About page sections here. Changes are saved with the page draft.</p>
      </header>

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold text-slate-900">Who We Are</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {input('Introductory label', whoWeAre.eyebrow, value => setField('whoWeAre', 'eyebrow', value))}
          {input('Main heading', whoWeAre.heading, value => setField('whoWeAre', 'heading', value))}
        </div>
        {input('Tagline', whoWeAre.tagline, value => setField('whoWeAre', 'tagline', value))}
        {input('Short description', whoWeAre.description, value => setField('whoWeAre', 'description', value), true)}
        {input('Full body text', whoWeAre.body, value => setField('whoWeAre', 'body', value), true)}
        {input('Image description for accessibility', whoWeAre.imageAlt, value => setField('whoWeAre', 'imageAlt', value))}
        {input('Video description for accessibility', whoWeAre.videoAlt, value => setField('whoWeAre', 'videoAlt', value))}
        <div className="grid gap-3 md:grid-cols-2">
          <MediaInput label="Main image" kind="image" value={whoWeAre.image} media={media} onChange={value => setField('whoWeAre', 'image', value)} onUpload={onUpload} />
          <div className="space-y-3">{input('Image caption', whoWeAre.imageCaption, value => setField('whoWeAre', 'imageCaption', value))}<MediaInput label="Supporting video" kind="video" value={whoWeAre.video} media={media} onChange={value => setField('whoWeAre', 'video', value)} onUpload={onUpload} />{input('Video caption', whoWeAre.videoCaption, value => setField('whoWeAre', 'videoCaption', value))}</div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-200 pt-5">
        <legend className="text-sm font-bold text-slate-900">Vision &amp; Mission</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {input('Section label', content.principlesEyebrow, value => setPageField('principlesEyebrow', value))}
          {input('Section heading', content.principlesHeading, value => setPageField('principlesHeading', value))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold uppercase text-slate-600">Vision</h3>
            {input('Label', vision.label, value => setField('vision', 'label', value))}
            {input('Heading', vision.heading, value => setField('vision', 'heading', value))}
            {input('Description', vision.description, value => setField('vision', 'description', value), true)}
            {input('Footer text', vision.footer, value => setField('vision', 'footer', value))}
            <MediaInput label="Supporting image" kind="image" value={vision.image} media={media} onChange={value => setField('vision', 'image', value)} onUpload={onUpload} />
            <MediaInput label="Supporting video" kind="video" value={vision.video} media={media} onChange={value => setField('vision', 'video', value)} onUpload={onUpload} />
          </div>
          <div className="space-y-3 rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold uppercase text-slate-600">Mission</h3>
            {input('Label', mission.label, value => setField('mission', 'label', value))}
            {input('Heading', mission.heading, value => setField('mission', 'heading', value))}
            {input('Description', mission.description, value => setField('mission', 'description', value), true)}
            {input('Footer text', mission.footer, value => setField('mission', 'footer', value))}
            <MediaInput label="Supporting image" kind="image" value={mission.image} media={media} onChange={value => setField('mission', 'image', value)} onUpload={onUpload} />
            <MediaInput label="Supporting video" kind="video" value={mission.video} media={media} onChange={value => setField('mission', 'video', value)} onUpload={onUpload} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-200 pt-5">
        <legend className="text-sm font-bold text-slate-900">Core Values</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {input('Section heading', content.coreValuesTitle, value => setPageField('coreValuesTitle', value))}
          {input('Introduction', content.coreValuesDescription, value => setPageField('coreValuesDescription', value), true)}
        </div>
        {coreValues.map((item, index) => (
          <div key={`value-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_2fr_auto]">
            {input('Value title', item.title, value => setItemField('coreValues', index, 'title', value))}
            {input('Description', item.desc, value => setItemField('coreValues', index, 'desc', value), true)}
            <div className="flex items-end gap-1">
              <button type="button" onClick={() => moveItem('coreValues', index, -1)} disabled={index === 0} aria-label="Move value up" className="rounded border p-2 disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => moveItem('coreValues', index, 1)} disabled={index === coreValues.length - 1} aria-label="Move value down" className="rounded border p-2 disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => removeItem('coreValues', index)} aria-label="Remove value" className="rounded border border-rose-200 p-2 text-rose-700"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => addItem('coreValues')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"><Plus className="h-4 w-4" />Add a value</button>
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-200 pt-5">
        <legend className="text-sm font-bold text-slate-900">Our Team</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {input('Section label', content.teamEyebrow, value => setPageField('teamEyebrow', value))}
          {input('Section heading', content.teamTitle, value => setPageField('teamTitle', value))}
        </div>
        {input('Introduction', content.teamDescription, value => setPageField('teamDescription', value), true)}
        {team.map((member, index) => (
          <div key={`member-${index}`} className="space-y-3 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700">Team member {index + 1}</h3>
              <div className="flex gap-1">
                <button type="button" onClick={() => moveItem('team', index, -1)} disabled={index === 0} aria-label="Move team member up" className="rounded border p-2 disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveItem('team', index, 1)} disabled={index === team.length - 1} aria-label="Move team member down" className="rounded border p-2 disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeItem('team', index)} aria-label="Remove team member" className="rounded border border-rose-200 p-2 text-rose-700"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {input('Name', member.name, value => setItemField('team', index, 'name', value))}
              {input('Position or role', member.role, value => setItemField('team', index, 'role', value))}
              {input('Location', member.location, value => setItemField('team', index, 'location', value))}
            </div>
            {input('Biography', member.bio, value => setItemField('team', index, 'bio', value), true)}
            <div className="grid gap-3 md:grid-cols-2">
              <MediaInput label="Profile image" kind="image" value={member.image} media={media} onChange={value => setItemField('team', index, 'image', value)} onUpload={onUpload} />
              <MediaInput label="Profile video (optional)" kind="video" value={member.video} media={media} onChange={value => setItemField('team', index, 'video', value)} onUpload={onUpload} />
              {input('Image caption', member.imageCaption, value => setItemField('team', index, 'imageCaption', value))}
              {input('Image description for accessibility', member.imageAlt, value => setItemField('team', index, 'imageAlt', value))}
              {input('Video description for accessibility', member.videoAlt, value => setItemField('team', index, 'videoAlt', value))}
            </div>
          </div>
        ))}
        <button type="button" onClick={() => addItem('team')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"><Plus className="h-4 w-4" />Add a team member</button>
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-200 pt-5">
        <legend className="text-sm font-bold text-slate-900">Additional About sections</legend>
        <p className="text-xs text-slate-600">Create sections such as Our History, Our Journey, or Achievements.</p>
        {additionalSections.map((section, index) => (
          <div key={`section-${index}`} className="space-y-3 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700">Section {index + 1}</h3>
              <div className="flex gap-1">
                <button type="button" onClick={() => moveItem('additionalSections', index, -1)} disabled={index === 0} aria-label="Move section up" className="rounded border p-2 disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveItem('additionalSections', index, 1)} disabled={index === additionalSections.length - 1} aria-label="Move section down" className="rounded border p-2 disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeItem('additionalSections', index)} aria-label="Remove section" className="rounded border border-rose-200 p-2 text-rose-700"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {input('Section title', section.title, value => setItemField('additionalSections', index, 'title', value))}
            {input('Section content', section.body, value => setItemField('additionalSections', index, 'body', value), true)}
            <div className="grid gap-3 md:grid-cols-2">
              <MediaInput label="Section image" kind="image" value={section.image} media={media} onChange={value => setItemField('additionalSections', index, 'image', value)} onUpload={onUpload} />
              <MediaInput label="Section video" kind="video" value={section.video} media={media} onChange={value => setItemField('additionalSections', index, 'video', value)} onUpload={onUpload} />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => addItem('additionalSections')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"><Plus className="h-4 w-4" />Add a section</button>
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-200 pt-5">
        <legend className="text-sm font-bold text-slate-900">About page closing banner</legend>
        {input('Heading', banner.title, value => setField('banner', 'title', value))}
        {input('Description', banner.description, value => setField('banner', 'description', value), true)}
        <div className="grid gap-3 md:grid-cols-2">
          <MediaInput label="Banner image" kind="image" value={banner.image} media={media} onChange={value => setField('banner', 'image', value)} onUpload={onUpload} />
          <MediaInput label="Banner video" kind="video" value={banner.video} media={media} onChange={value => setField('banner', 'video', value)} onUpload={onUpload} />
          {input('Image caption', banner.imageCaption, value => setField('banner', 'imageCaption', value))}
          {input('Video caption', banner.videoCaption, value => setField('banner', 'videoCaption', value))}
          {input('Programs button label', banner.exploreAction, value => setField('banner', 'exploreAction', value))}
          {input('Partnership button label', banner.partnerAction, value => setField('banner', 'partnerAction', value))}
        </div>
      </fieldset>
    </section>
  );
};