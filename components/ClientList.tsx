
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Client, ClientType } from '../types';
import { 
  UserPlus, Search, Phone, MapPin, ChevronRight, 
  Building2, User, Mail, Plus, Users, Filter
} from 'lucide-react';

interface ClientListProps {
  onSelectClient: (id: number) => void;
}

const ClientList: React.FC<ClientListProps> = ({ onSelectClient }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | ClientType>('all');

  // Form state
  const [type, setType] = useState<ClientType>(ClientType.INDIVIDUAL);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nif, setNif] = useState('');
  const [stat, setStat] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setClients(await db.clients.toArray());
  };

  const handleAddClient = async () => {
    if (!name) return;
    await db.clients.add({ 
      name, 
      type,
      email, 
      phone, 
      address, 
      nif: type === ClientType.COMPANY ? nif : '', 
      stat: type === ClientType.COMPANY ? stat : '', 
      notes: '' 
    });
    setName(''); setEmail(''); setPhone(''); setAddress(''); setNif(''); setStat(''); setType(ClientType.INDIVIDUAL);
    setShowForm(false);
    loadClients();
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.phone?.includes(searchTerm);
    const matchesFilter = filterType === 'all' || c.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      {/* Header & New Client Trigger */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <Users size={18} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Annuaire Clients</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Répertoire Partenaires</h2>
          <p className="text-sm text-slate-400 font-medium">Gérez vos relations {clients.length} contacts enregistrés.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 hover:shadow-emerald-200 active:scale-95 transition-all group"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform">
            <Plus size={16} strokeWidth={3} />
          </div>
          Ajouter un Client
        </button>
      </div>

      {/* Modern Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input 
            placeholder="Rechercher par nom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4.5 bg-white border border-slate-100 rounded-3xl text-sm font-bold shadow-sm outline-none transition-all focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-3xl shadow-sm">
          {[
            { id: 'all', label: 'Tous', icon: <Users size={14}/> },
            { id: ClientType.INDIVIDUAL, label: 'Particuliers', icon: <User size={14}/> },
            { id: ClientType.COMPANY, label: 'Sociétés', icon: <Building2 size={14}/> }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                filterType === btn.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Form Overlay / Panel */}
      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center">
             <h3 className="font-black text-slate-800 text-lg tracking-tight">Nouvelle Fiche Contact</h3>
             <button onClick={() => setShowForm(false)} className="text-slate-300 hover:text-slate-500"><Plus size={24} className="rotate-45"/></button>
          </div>
          
          <div className="flex p-1.5 bg-slate-50 rounded-[1.8rem] gap-1.5">
            <button 
              onClick={() => setType(ClientType.INDIVIDUAL)}
              className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl text-xs font-black transition-all ${type === ClientType.INDIVIDUAL ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}
            >
              <User size={16} strokeWidth={2.5} /> Particulier
            </button>
            <button 
              onClick={() => setType(ClientType.COMPANY)}
              className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl text-xs font-black transition-all ${type === ClientType.COMPANY ? 'bg-white text-sky-600 shadow-md' : 'text-slate-400'}`}
            >
              <Building2 size={16} strokeWidth={2.5} /> Société
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Identité</label>
              <input 
                placeholder={type === ClientType.COMPANY ? "Raison Sociale de l'entreprise" : "Nom complet du client"} 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Téléphone (Mada)</label>
              <input placeholder="Ex: 034 00 000 00" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Professionnel</label>
              <input placeholder="nom@exemple.mg" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none" />
            </div>

            {type === ClientType.COMPANY && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest ml-2">Numéro NIF</label>
                  <input placeholder="10 chiffres..." value={nif} onChange={e => setNif(e.target.value)} className="w-full p-4 bg-sky-50 border-2 border-transparent rounded-2xl text-sm font-black text-sky-700 focus:border-sky-500 focus:bg-white outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest ml-2">Numéro STAT</label>
                  <input placeholder="Numéro STAT..." value={stat} onChange={e => setStat(e.target.value)} className="w-full p-4 bg-sky-50 border-2 border-transparent rounded-2xl text-sm font-black text-sky-700 focus:border-sky-500 focus:bg-white outline-none" />
                </div>
              </>
            )}

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Localisation / Siège</label>
              <input placeholder="Quartier, Ville, Code Postal..." value={address} onChange={e => setAddress(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleAddClient} className="flex-1 bg-slate-900 text-white py-4.5 rounded-2xl font-black shadow-xl active:scale-[0.98] transition-all">Valider la création</button>
            <button onClick={() => setShowForm(false)} className="px-8 py-4.5 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-colors">Fermer</button>
          </div>
        </div>
      )}

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => {
          const isComp = client.type === ClientType.COMPANY;
          return (
            <button 
              key={client.id} 
              onClick={() => onSelectClient(client.id!)}
              className={`bg-white p-5 rounded-[2.2rem] border-2 border-transparent shadow-sm flex flex-col gap-4 hover:border-slate-200 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all text-left relative overflow-hidden group`}
            >
              {/* Type Indicator Bar */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${isComp ? 'bg-sky-500' : 'bg-emerald-500'}`}></div>
              
              <div className="flex items-start justify-between">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner ${isComp ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {isComp ? <Building2 size={24} strokeWidth={2.5}/> : <span className="font-black text-lg">{getInitials(client.name)}</span>}
                </div>
                <div className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isComp ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {client.type}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-emerald-700 transition-colors line-clamp-1">{client.name}</h4>
                <div className="flex items-center gap-1.5 text-slate-400">
                   <Phone size={12} className="shrink-0" />
                   <span className="text-xs font-bold">{client.phone || '-- -- --- --'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <MapPin size={12} />
                  <span className="text-[10px] font-bold truncate max-w-[120px]">{client.address || 'Localisation...'}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <ChevronRight size={16} strokeWidth={3} />
                </div>
              </div>
            </button>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 animate-in fade-in zoom-in duration-700">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
              <Users size={40} />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Aucun partenaire trouvé</p>
            <p className="text-slate-300 text-xs mt-1">Essayez d'ajuster vos filtres de recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientList;
