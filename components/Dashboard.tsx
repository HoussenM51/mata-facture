
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Invoice, InvoiceStatus, UserSettings, QuickSale } from '../types';
import { TrendingUp, FileText, ArrowRight, CheckCircle2, Wallet, Eye, EyeOff, Coins, Star, CalendarDays } from 'lucide-react';
import { formatAr } from '../utils/formatters';

interface DashboardProps {
  onAction: (view: string) => void;
}

const DashboardView: React.FC<DashboardProps> = ({ onAction }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [stats, setStats] = useState({ 
    dailyRevenue: 0, 
    dailyProfit: 0, 
    totalReceivables: 0, 
    pendingCount: 0 
  });
  const [topProfitable, setTopProfitable] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startTimestamp = startOfDay.getTime();

      const [invoices, sales, transactions, s] = await Promise.all([
        db.invoices.toArray(),
        db.sales.toArray(),
        db.transactions.where('timestamp').aboveOrEqual(startTimestamp).toArray(),
        db.settings.toCollection().first()
      ]);
      setSettings(s || null);

      // 1. Chiffre d'Affaire du JOUR (uniquement ce qui est encaissé aujourd'hui)
      const dailyRevenue = transactions.reduce((acc, tx) => acc + tx.amount, 0);

      // 2. Créances TOTALES (Toutes les factures non payées de l'histoire)
      const pendingInvoices = invoices.filter(inv => 
        inv.status !== InvoiceStatus.PAYE && 
        inv.status !== InvoiceStatus.ANNULE && 
        inv.status !== InvoiceStatus.BROUILLON
      );
      const totalReceivables = pendingInvoices.reduce((acc, inv) => acc + (inv.total - (inv.paidAmount || 0)), 0);

      // 3. Bénéfice du JOUR (Uniquement sur les ventes du jour)
      const dailySales = sales.filter(s => s.timestamp >= startTimestamp);
      const dailyInvoices = invoices.filter(inv => {
         // On considère le bénéfice des factures créées aujourd'hui et validées
         return inv.date === todayStr && inv.status !== InvoiceStatus.ANNULE && inv.status !== InvoiceStatus.BROUILLON;
      });

      const profitFromInvoices = dailyInvoices.reduce((acc, inv) => {
        const margin = inv.items.reduce((m, item) => m + ((item.unitPrice - item.purchasePrice) * item.quantity), 0);
        return acc + margin;
      }, 0);

      const profitFromSales = dailySales.reduce((acc, sale) => acc + ((sale.unitPrice - sale.purchasePrice) * sale.quantity), 0);

      // Analyse des produits les plus rentables (Top 3 historique pour la visibilité)
      const productMargins: Record<string, { name: string, totalProfit: number }> = {};
      sales.forEach(s => {
        const profit = (s.unitPrice - s.purchasePrice) * s.quantity;
        if (!productMargins[s.productName]) productMargins[s.productName] = { name: s.productName, totalProfit: 0 };
        productMargins[s.productName].totalProfit += profit;
      });
      invoices.filter(i => i.status !== InvoiceStatus.ANNULE).forEach(inv => {
        inv.items.forEach(item => {
          const profit = (item.unitPrice - item.purchasePrice) * item.quantity;
          if (!productMargins[item.description]) productMargins[item.description] = { name: item.description, totalProfit: 0 };
          productMargins[item.description].totalProfit += profit;
        });
      });

      const top = Object.values(productMargins)
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 3);

      setTopProfitable(top);
      setStats({
        dailyRevenue,
        dailyProfit: profitFromInvoices + profitFromSales,
        totalReceivables,
        pendingCount: pendingInvoices.length
      });
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vue d'ensemble</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Activité du jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
          <CalendarDays size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard 
          label="Recette Encaissée (Aujourd'hui)" 
          value={formatAr(stats.dailyRevenue)} 
          icon={<CheckCircle2 className="text-emerald-600" size={20} />}
          bgColor="bg-emerald-50"
          accentColor="border-emerald-100"
          badge="Aujourd'hui"
        />
        
        <div className={`bg-white p-5 rounded-[2rem] shadow-sm border space-y-3 transition-all ${settings?.showProfits ? 'border-sky-100' : 'border-slate-100 opacity-80'}`}>
          <div className="flex justify-between items-start">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${settings?.showProfits ? 'bg-sky-50' : 'bg-slate-50'}`}>
              <Coins className={settings?.showProfits ? 'text-sky-600' : 'text-slate-400'} size={20} />
            </div>
            {settings?.showProfits ? <Eye size={16} className="text-slate-300" /> : <EyeOff size={16} className="text-slate-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bénéfice Net Estimé</p>
              <span className="text-[8px] bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Jour</span>
            </div>
            {settings?.showProfits ? (
              <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">{formatAr(stats.dailyProfit)}</p>
            ) : (
              <div className="flex gap-1 py-2">
                {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 bg-slate-200 rounded-full animate-pulse"></div>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard 
          label="Créances Clients (Total)" 
          value={formatAr(stats.totalReceivables)} 
          icon={<Wallet className="text-orange-600" size={20} />}
          bgColor="bg-orange-50"
          accentColor="border-orange-100"
          badge="Global"
        />
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all">
          <div className="flex items-center gap-3">
             <div className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
               <FileText size={20} />
             </div>
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase">Dossiers en attente</p>
               <p className="text-lg font-black text-slate-800">{stats.pendingCount} documents</p>
             </div>
          </div>
          <button onClick={() => onAction('invoices')} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-emerald-600 hover:text-white transition-all"><ArrowRight size={18}/></button>
        </div>
      </div>

      {settings?.showProfits && topProfitable.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 px-2">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            Produits Stars (Top Rentabilité)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topProfitable.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-[1.8rem] border border-slate-100 flex flex-col gap-2 shadow-sm hover:border-emerald-100 transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center font-black text-slate-400 text-[10px]">
                    #{idx + 1}
                  </div>
                  <p className="font-black text-slate-800 text-xs truncate flex-1">{item.name}</p>
                </div>
                <div className="flex justify-between items-end mt-1">
                   <p className="text-[8px] font-black text-slate-300 uppercase">Bénéfice Total</p>
                   <p className="text-xs font-black text-emerald-600 tracking-tight">{formatAr(item.totalProfit)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-all">
        <div className="relative z-10 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black leading-tight">Accéder au Journal de Caisse</h3>
            <p className="text-slate-400 text-xs font-medium opacity-80 max-w-[200px]">Enregistrez vos ventes directes et clôturez votre journée.</p>
          </div>
          <button 
            onClick={() => onAction('cahier')}
            className="bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20"
          >
            Ouvrir le Cahier <ArrowRight size={16} />
          </button>
        </div>
        {/* Abstract background design */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -ml-10 -mb-10"></div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; bgColor: string; accentColor: string, badge?: string }> = ({ label, value, icon, bgColor, accentColor, badge }) => (
  <div className={`bg-white p-5 rounded-[2rem] shadow-sm border ${accentColor} space-y-3`}>
    <div className="flex justify-between items-start">
      <div className={`${bgColor} w-11 h-11 rounded-2xl flex items-center justify-center`}>
        {icon}
      </div>
      {badge && (
        <span className={`${bgColor} text-[8px] font-black px-2 py-1 rounded uppercase tracking-tighter ${icon && (icon as any).props.className}`}>
          {badge}
        </span>
      )}
    </div>
    <div className="overflow-hidden">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-2xl font-black text-slate-900 truncate tracking-tighter tabular-nums">{value}</p>
    </div>
  </div>
);

export default DashboardView;
