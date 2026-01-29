
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { Invoice, Client, InvoiceStatus, UserSettings, PaymentMethod, DocumentType } from '../types';
import { 
  Search, Plus, FileText, Share2, Printer, Clock, CheckCircle2, 
  X, Coins, Filter, FileCheck, FileCode, Receipt
} from 'lucide-react';
import { shareInvoice, generateInvoicePDF } from '../utils/pdfGenerator';
import { formatAr } from '../utils/formatters';

interface InvoiceListProps {
  onNew: () => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ onNew }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Record<number, Client>>({});
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Par défaut, on affiche les Factures
  const [selectedType, setSelectedType] = useState<'all' | DocumentType>(DocumentType.FACTURE);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [invs, cls, s] = await Promise.all([
      db.invoices.reverse().toArray(),
      db.clients.toArray(),
      db.settings.toCollection().first()
    ]);
    const clientMap = cls.reduce((acc, c) => ({ ...acc, [c.id!]: c }), {});
    setInvoices(invs);
    setClients(clientMap);
    setSettings(s || null);
  };

  const filteredItems = useMemo(() => {
    const query = searchTerm.toLowerCase();
    
    return invoices.filter(inv => {
      const client = clients[inv.clientId]?.name.toLowerCase() || "";
      const num = inv.number.toLowerCase();
      const matchesSearch = client.includes(query) || num.includes(query);
      const matchesType = selectedType === 'all' || inv.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [invoices, clients, searchTerm, selectedType]);

  const getStatusBadge = (invoice: Invoice) => {
    switch (invoice.status) {
      case InvoiceStatus.PAYE: return <span className="bg-emerald-100 text-emerald-700 flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter"><CheckCircle2 size={10} /> Payé</span>;
      case InvoiceStatus.ANNULE: return <span className="bg-red-100 text-red-700 flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter"><X size={10} /> Annulé</span>;
      case InvoiceStatus.PARTIEL: return <span className="bg-sky-100 text-sky-700 flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter"><Coins size={10} /> Partiel</span>;
      default: return <span className="bg-orange-100 text-orange-700 flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter"><Clock size={10} /> À Encaisser</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case DocumentType.FACTURE: return <FileCheck className="text-emerald-500" size={18} />;
      case DocumentType.DEVIS: return <FileCode className="text-sky-500" size={18} />;
      case DocumentType.RECU: return <Receipt className="text-amber-500" size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const stats = useMemo(() => {
    const items = invoices.filter(i => selectedType === 'all' || i.type === selectedType);
    const total = items.reduce((acc, i) => acc + i.total, 0);
    const due = items.reduce((acc, i) => acc + (i.total - (i.paidAmount || 0)), 0);
    return { total, due };
  }, [invoices, selectedType]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {selectedType === 'all' ? 'Documents Clients' : `${selectedType}s`}
            </h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
              Gestion de la facturation et des devis
            </p>
          </div>
          <button onClick={onNew} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all">
            <Plus size={18} strokeWidth={3} /> NOUVEAU DOC
          </button>
        </div>

        <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-[1.8rem] shadow-sm overflow-x-auto no-scrollbar">
          {[
            { id: DocumentType.FACTURE, label: 'Factures', icon: <FileCheck size={14}/> },
            { id: DocumentType.DEVIS, label: 'Devis', icon: <FileCode size={14}/> },
            { id: DocumentType.RECU, label: 'Reçus', icon: <Receipt size={14}/> },
            { id: 'all', label: 'Tout voir', icon: <Filter size={14}/> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${
                selectedType === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon} {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] ${selectedType === tab.id ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
                {tab.id === 'all' ? invoices.length : invoices.filter(i => i.type === tab.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total {selectedType === 'all' ? 'Général' : selectedType}</p>
            <p className="text-xl font-black text-slate-900">{formatAr(stats.total)}</p>
          </div>
          <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100 shadow-sm">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Reste à percevoir</p>
            <p className="text-xl font-black text-orange-700">{formatAr(stats.due)}</p>
          </div>
        </div>
      )}

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          placeholder={`Chercher un client ou un numéro de document...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4.5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold shadow-sm outline-none transition-all focus:ring-4 focus:ring-emerald-500/5"
        />
      </div>

      <div className="space-y-3">
        {filteredItems.length > 0 ? filteredItems.map((inv) => {
          return (
            <div key={inv.id} className="bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between group transition-all hover:border-emerald-200 animate-in slide-in-from-bottom">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50">{getTypeIcon(inv.type)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-800 text-sm leading-none">{clients[inv.clientId]?.name || 'Client de passage'}</p>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                      inv.type === DocumentType.FACTURE ? 'bg-emerald-50 text-emerald-600' : 
                      inv.type === DocumentType.DEVIS ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {inv.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5">{inv.number} • {new Date(inv.date).toLocaleDateString('fr-FR')}</p>
                  <div className="mt-2">{getStatusBadge(inv)}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-slate-50">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase">Montant TTC</p>
                  <p className="font-black text-slate-900 text-base tracking-tighter">{formatAr(inv.total)}</p>
                </div>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                  <button onClick={() => shareInvoice(inv, clients[inv.clientId], settings!)} className="p-2 text-slate-400 hover:text-sky-500 transition-colors" title="Partager"><Share2 size={18}/></button>
                  <button onClick={() => generateInvoicePDF(inv, clients[inv.clientId], settings!).then(d => d.save())} className="p-2 text-slate-400 hover:text-slate-800 transition-colors" title="Imprimer"><Printer size={18}/></button>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <FileText size={48} className="text-slate-100 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Aucun document trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
