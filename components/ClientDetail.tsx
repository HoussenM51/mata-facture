
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Client, ClientType, Invoice, InvoiceStatus } from '../types';
import { 
  ChevronLeft, Phone, Mail, MapPin, FileText, Save, Edit3, 
  Wallet, TrendingUp, History, Info, Building2 
} from 'lucide-react';
import { formatAr } from '../utils/formatters';

interface ClientDetailProps {
  clientId: number;
  onBack: () => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ clientId, onBack }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [stats, setStats] = useState({ totalPaid: 0, totalDue: 0, invoiceCount: 0 });

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    const [c, invs] = await Promise.all([
      db.clients.get(clientId),
      db.invoices.where('clientId').equals(clientId).reverse().toArray()
    ]);

    if (c) {
      setClient(c);
      setTempNotes(c.notes || '');
    }
    setInvoices(invs);

    const s = invs.reduce((acc, inv) => {
      if (inv.status === InvoiceStatus.PAYE) {
        acc.totalPaid += inv.total;
      } else if (inv.status !== InvoiceStatus.ANNULE) {
        acc.totalDue += inv.total;
      }
      acc.invoiceCount++;
      return acc;
    }, { totalPaid: 0, totalDue: 0, invoiceCount: 0 });

    setStats(s);
  };

  const handleSaveNotes = async () => {
    if (!client) return;
    await db.clients.update(clientId, { notes: tempNotes });
    setClient({ ...client, notes: tempNotes });
    setIsEditingNotes(false);
  };

  if (!client) return <div className="p-10 text-center animate-pulse">Chargement...</div>;

  const isCompany = client.type === ClientType.COMPANY;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-20">
      <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className={`${isCompany ? 'bg-sky-600' : 'bg-emerald-600'} p-6 flex items-center gap-4 relative transition-colors`}>
          <button onClick={onBack} className={`absolute top-4 left-4 p-2 ${isCompany ? 'bg-sky-500/50' : 'bg-emerald-500/50'} text-white rounded-full active:scale-90 transition-transform`}>
            <ChevronLeft size={20} />
          </button>
          <div className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center ${isCompany ? 'text-sky-600' : 'text-emerald-600'} font-black text-2xl shadow-xl ml-4`}>
            {isCompany ? <Building2 size={32} /> : client.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-white mt-4 ml-2">
            <h2 className="text-xl font-black leading-none">{client.name}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isCompany ? 'bg-sky-400/30' : 'bg-emerald-400/30'}`}>
                {client.type}
              </span>
              <p className="text-[10px] font-bold opacity-70">Client depuis {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 divide-x">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Rapide</p>
              {client.phone ? (
                <a href={`tel:${client.phone}`} className={`flex items-center gap-2 ${isCompany ? 'text-sky-600' : 'text-emerald-600'} font-bold text-sm`}>
                  <Phone size={14} /> {client.phone}
                </a>
              ) : <p className="text-xs text-slate-300 italic">Pas de tel</p>}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-slate-500 font-medium text-xs truncate">
                  <Mail size={14} /> {client.email}
                </a>
              )}
            </div>
            <div className="pl-4 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localisation</p>
              <p className="text-xs text-slate-600 font-bold flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" /> {client.address || 'Non spécifiée'}
              </p>
            </div>
          </div>

          {isCompany && (client.nif || client.stat) && (
            <div className="bg-sky-50 rounded-2xl p-4 flex gap-6 border border-sky-100">
               <div>
                 <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Numéro NIF</p>
                 <p className="text-sm font-black text-sky-800">{client.nif || '---'}</p>
               </div>
               <div>
                 <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Numéro STAT</p>
                 <p className="text-sm font-black text-sky-800">{client.stat || '---'}</p>
               </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-5 rounded-[2rem] border border-emerald-100 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600">
            <TrendingUp size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Total Payé</span>
          </div>
          <p className="text-xl font-black text-emerald-700 tracking-tight">{formatAr(stats.totalPaid)}</p>
        </div>
        <div className="bg-orange-50 p-5 rounded-[2rem] border border-orange-100 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-orange-600">
            <Wallet size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Dû (Impayés)</span>
          </div>
          <p className="text-xl font-black text-orange-700 tracking-tight">{formatAr(stats.totalDue)}</p>
        </div>
      </div>

      <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
            <Info size={14} className="text-sky-500" />
            Note de suivi client
          </h3>
          <button 
            onClick={() => isEditingNotes ? handleSaveNotes() : setIsEditingNotes(true)}
            className={`p-2 rounded-xl transition-all ${isEditingNotes ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-emerald-600'}`}
          >
            {isEditingNotes ? <Save size={16} /> : <Edit3 size={16} />}
          </button>
        </div>

        {isEditingNotes ? (
          <textarea 
            autoFocus
            value={tempNotes}
            onChange={e => setTempNotes(e.target.value)}
            className="w-full h-24 p-4 bg-slate-50 border-2 border-emerald-100 rounded-2xl text-sm font-medium outline-none focus:ring-0"
            placeholder="Ajouter une observation sur ce client..."
          />
        ) : (
          <div className={`p-4 rounded-2xl min-h-[4rem] flex items-center ${client.notes ? 'bg-slate-50 text-slate-600' : 'bg-slate-50/50 border border-dashed text-slate-300 italic text-sm'}`}>
            {client.notes || "Aucune note pour le moment. Cliquez sur le stylo pour en ajouter."}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
            <History size={14} className="text-slate-400" />
            Historique des factures
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
            {invoices.length} docs
          </span>
        </div>

        <div className="space-y-3">
          {invoices.length > 0 ? invoices.map((inv) => (
            <div key={inv.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  inv.status === InvoiceStatus.PAYE ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm leading-none">{inv.number}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">
                    {new Date(inv.date).toLocaleDateString('fr-FR')} • {inv.type}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-800 text-sm tracking-tight">{formatAr(inv.total)}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 bg-white rounded-[2rem] border border-dashed border-slate-100">
              <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Aucune facture enregistrée</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ClientDetail;
