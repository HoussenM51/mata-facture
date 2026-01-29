
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { UserSettings, BusinessDomain } from '../types';
import { 
  Camera, Save, RefreshCw, CheckCircle2, EyeOff, Eye, 
  Landmark, Building2, Phone, Mail, MapPin, Hash, Percent,
  Image as ImageIcon, Trash2
} from 'lucide-react';

const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.settings.toCollection().first().then(s => setSettings(s || null));
  }, []);

  const handleChange = (field: keyof UserSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    await db.settings.update(settings.id!, settings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!settings) return <div className="p-10 text-center animate-pulse text-slate-400">Chargement des paramètres...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Configuration</h2>
          <p className="text-sm text-slate-400 font-medium">Personnalisez votre profil d'entreprise et vos factures.</p>
        </div>
        {showSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 animate-in zoom-in">
            <CheckCircle2 size={16} /> Modifications Enregistrées
          </div>
        )}
      </div>

      {/* SECTION 1: IDENTITÉ VISUELLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-slate-900 relative">
          <div className="absolute -bottom-12 left-8 group">
            <div className="w-28 h-28 bg-white rounded-3xl border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden relative">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo Business" className="w-full h-full object-contain p-2" />
              ) : (
                <ImageIcon size={40} className="text-slate-200" />
              )}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <Camera size={24} />
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </div>
          {settings.logoUrl && (
            <button 
              onClick={() => handleChange('logoUrl', '')}
              className="absolute -bottom-10 left-40 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="pt-16 p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dénomination Sociale</label>
            <input 
              value={settings.businessName} 
              onChange={e => handleChange('businessName', e.target.value)}
              placeholder="Ex: MADA DISTRIB SARLU"
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-lg font-black text-slate-800 focus:border-emerald-500 focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">E-mail de contact</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input value={settings.email} onChange={e => handleChange('email', e.target.value)} placeholder="contact@entreprise.mg" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input value={settings.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+261 34 00 000 00" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Adresse du Siège</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input value={settings.address} onChange={e => handleChange('address', e.target.value)} placeholder="Ex: Lot IVG 22, Antananarivo" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MENTIONS LÉGALES */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
            <Building2 size={20} />
          </div>
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Mentions Fiscales & Bancaires</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Numéro NIF</label>
            <input value={settings.nif} onChange={e => handleChange('nif', e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Numéro STAT</label>
            <input value={settings.stat} onChange={e => handleChange('stat', e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Registre (RCS)</label>
            <input value={settings.rcs} onChange={e => handleChange('rcs', e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-emerald-500" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
            <Landmark size={12} /> Coordonnées Bancaires (Sur PDF)
          </label>
          <textarea 
            value={settings.bankInfo || ''} 
            onChange={e => handleChange('bankInfo', e.target.value)}
            placeholder="Nom Banque, Code RIB, IBAN..."
            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold h-24 focus:border-emerald-500 outline-none"
          />
        </div>
      </section>

      {/* SECTION 3: FACTURATION */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
            <Hash size={20} />
          </div>
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Configuration Facturation</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Préfixe de facture</label>
            <input value={settings.invoicePrefix} onChange={e => handleChange('invoicePrefix', e.target.value.toUpperCase())} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-black focus:border-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Prochain numéro</label>
            <input type="number" value={settings.nextInvoiceNumber} onChange={e => handleChange('nextInvoiceNumber', Number(e.target.value))} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-black focus:border-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
              <Percent size={12} /> TVA par défaut (%)
            </label>
            <input type="number" value={settings.defaultVat} onChange={e => handleChange('defaultVat', Number(e.target.value))} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-black focus:border-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Devise utilisée</label>
            <input value={settings.currency} onChange={e => handleChange('currency', e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-black focus:border-emerald-500" />
          </div>
        </div>

        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${settings.showProfits ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
              {settings.showProfits ? <Eye size={24} /> : <EyeOff size={24} />}
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Afficher les marges & bénéfices</p>
              <p className="text-[10px] text-slate-400 font-medium">Contrôlez la visibilité des chiffres sensibles.</p>
            </div>
          </div>
          <button 
            onClick={() => handleChange('showProfits', !settings.showProfits)}
            className={`w-14 h-7 rounded-full transition-all relative ${settings.showProfits ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${settings.showProfits ? 'left-8' : 'left-1'}`}></div>
          </button>
        </div>
      </section>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={handleSave}
          className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 active:scale-[0.98] transition-all"
        >
          <Save size={24} /> Enregistrer la Configuration
        </button>
        <div className="flex gap-3">
          <button className="flex-1 bg-white text-slate-500 py-4 rounded-2xl font-bold border border-slate-100 flex items-center justify-center gap-2 text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">
            <RefreshCw size={18} /> Sauvegarde Locale
          </button>
          <button className="flex-1 bg-white text-slate-300 py-4 rounded-2xl font-bold border border-slate-100 flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-not-allowed">
             Cloud Sync <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded ml-1">Bientôt</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
