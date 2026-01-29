
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { DailyClosing, UserSettings } from '../types';
import { Search, History, Printer, Calendar, FileCheck, TrendingUp, Filter, ReceiptText } from 'lucide-react';
import { generateDailyReportPDF } from '../utils/pdfGenerator';
import { formatAr } from '../utils/formatters';

const ClosingArchive: React.FC = () => {
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [clsngs, s] = await Promise.all([
      db.closings.reverse().toArray(),
      db.settings.toCollection().first()
    ]);
    setClosings(clsngs);
    setSettings(s || null);
  };

  const filteredClosings = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return closings.filter(c => 
      c.number.toLowerCase().includes(query) || 
      c.date.includes(query)
    );
  }, [closings, searchTerm]);

  const handlePrint = async (closing: DailyClosing) => {
    if (!settings) return;
    const doc = await generateDailyReportPDF(
      [], // On ne stocke pas le détail des tx dans l'objet DailyClosing simple, on utilise les agrégats
      closing.aggregatedProducts, 
      { 
        total: closing.totalRevenue, 
        profit: closing.totalProfit, 
        cash: closing.cashAmount, 
        mobile: closing.mobileAmount, 
        credit: closing.creditAmount 
      }, 
      closing.date, 
      settings
    );
    doc.save(`${closing.number}_DUPLICATA.pdf`);
  };

  const globalStats = useMemo(() => {
    return {
      totalRevenue: closings.reduce((sum, c) => sum + c.totalRevenue, 0),
      count: closings.length
    };
  }, [closings]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Archives Journalières</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Journaux de caisse clôturés</p>
          </div>
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <History size={24} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cumul Archivé</p>
              <p className="text-xl font-black text-slate-900">{formatAr(globalStats.totalRevenue)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
              <ReceiptText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Journées Clôturées</p>
              <p className="text-xl font-black text-slate-900">{globalStats.count} documents</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          placeholder="Rechercher une clôture (ex: 2024-05)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4.5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold shadow-sm outline-none transition-all focus:ring-4 focus:ring-slate-900/5"
        />
      </div>

      <div className="space-y-4">
        {filteredClosings.length > 0 ? filteredClosings.map((closing) => (
          <div key={closing.id} className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 group transition-all animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/10 rounded-[1.2rem] flex items-center justify-center text-emerald-400 shadow-inner">
                <FileCheck size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-black text-base tracking-tight leading-none mb-1.5">{closing.number}</p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <Calendar size={12} /> {new Date(closing.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                    {closing.transactionsCount} Flux
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Recette Journalière</p>
                <p className="font-black text-xl tracking-tighter text-emerald-400 tabular-nums">{formatAr(closing.totalRevenue)}</p>
              </div>
              <button 
                onClick={() => handlePrint(closing)}
                className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 hover:scale-105 transition-all shadow-lg active:scale-95"
                title="Imprimer le PV de Clôture"
              >
                <Printer size={20} />
              </button>
            </div>
          </div>
        )) : (
          <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <History size={48} className="text-slate-100 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm text-center px-6">Aucune archive de clôture trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClosingArchive;
