
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { PaymentMethod, UserSettings, PaymentTransaction, DailyClosing } from '../types';
import { 
  Plus, ShoppingBag, Wallet, History, 
  Calendar, FileText, Printer, ChevronLeft, ChevronRight, CheckCircle, Save
} from 'lucide-react';
import QuickSaleForm from './QuickSaleForm';
import { generateDailyReportPDF } from '../utils/pdfGenerator';
import { formatAr } from '../utils/formatters';

const SalesJournal: React.FC = () => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [aggregatedProducts, setAggregatedProducts] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [dailyStats, setDailyStats] = useState({ total: 0, profit: 0, cash: 0, mobile: 0, credit: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [closingExists, setClosingExists] = useState(false);

  const loadData = async (dateStr: string) => {
    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [txs, sales, invoices, s, allProducts, existingClosing] = await Promise.all([
      db.transactions.where('timestamp').between(startOfDay.getTime(), endOfDay.getTime()).toArray(),
      db.sales.where('timestamp').between(startOfDay.getTime(), endOfDay.getTime()).toArray(),
      db.invoices.where('date').equals(dateStr).toArray(),
      db.settings.toCollection().first(),
      db.products.toArray(),
      db.closings.where('date').equals(dateStr).first()
    ]);

    setSettings(s || null);
    setClosingExists(!!existingClosing);
    
    const sortedTxs = txs.sort((a, b) => b.timestamp - a.timestamp);
    setTransactions(sortedTxs);

    const productMap: Record<string, any> = {};
    const stockMap = allProducts.reduce((acc, p) => ({ ...acc, [p.name]: p.stock }), {});

    sales.forEach(sale => {
      if (!productMap[sale.productName]) {
        productMap[sale.productName] = { name: sale.productName, quantity: 0, revenue: 0, profit: 0, currentStock: stockMap[sale.productName] || 0 };
      }
      productMap[sale.productName].quantity += sale.quantity;
      productMap[sale.productName].revenue += sale.total;
      productMap[sale.productName].profit += (sale.unitPrice - sale.purchasePrice) * sale.quantity;
    });

    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!productMap[item.description]) {
          productMap[item.description] = { name: item.description, quantity: 0, revenue: 0, profit: 0, currentStock: stockMap[item.description] || 0 };
        }
        productMap[item.description].quantity += item.quantity;
        productMap[item.description].revenue += item.quantity * item.unitPrice;
        productMap[item.description].profit += (item.unitPrice - item.purchasePrice) * item.quantity;
      });
    });

    const aggregated = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
    setAggregatedProducts(aggregated);

    setDailyStats({
      total: sortedTxs.reduce((sum, tx) => sum + tx.amount, 0),
      profit: aggregated.reduce((sum, p) => sum + p.profit, 0),
      cash: sortedTxs.filter(t => t.method === PaymentMethod.ESPECES).reduce((sum, t) => sum + t.amount, 0),
      mobile: sortedTxs.filter(t => t.method === PaymentMethod.MOBILE_MONEY).reduce((sum, t) => sum + t.amount, 0),
      credit: sortedTxs.filter(t => t.method === PaymentMethod.CREDIT).reduce((sum, t) => sum + t.amount, 0),
    });
  };

  useEffect(() => { loadData(selectedDate); }, [selectedDate]);

  const handleFinalizeClosing = async () => {
    if (!settings || transactions.length === 0) return;
    if (closingExists && !confirm("Une clôture existe déjà pour cette date. Voulez-vous la remplacer ?")) return;

    setIsSaving(true);
    try {
      const closingNumber = `CLOT-${selectedDate.replace(/-/g, '')}-${String(settings.nextClosingNumber || 1).padStart(3, '0')}`;
      
      const closingRecord: DailyClosing = {
        number: closingNumber,
        date: selectedDate,
        timestamp: Date.now(),
        totalRevenue: dailyStats.total,
        totalProfit: dailyStats.profit,
        cashAmount: dailyStats.cash,
        mobileAmount: dailyStats.mobile,
        creditAmount: dailyStats.credit,
        transactionsCount: transactions.length,
        aggregatedProducts: aggregatedProducts.map(p => ({
          name: p.name,
          quantity: p.quantity,
          revenue: p.revenue,
          profit: p.profit
        }))
      };

      if (closingExists) {
        const existing = await db.closings.where('date').equals(selectedDate).first();
        if (existing) await db.closings.delete(existing.id!);
      }

      await db.closings.add(closingRecord);
      await db.settings.update(settings.id!, { nextClosingNumber: (settings.nextClosingNumber || 1) + 1 });
      
      const doc = await generateDailyReportPDF(transactions, aggregatedProducts, dailyStats, selectedDate, settings);
      doc.save(`${closingNumber}.pdf`);
      
      setClosingExists(true);
      alert("La clôture a été enregistrée et archivée avec succès.");
    } catch (e) {
      alert("Erreur lors de l'archivage de la clôture.");
    } finally {
      setIsSaving(false);
    }
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 text-slate-400 hover:text-emerald-600"><ChevronLeft size={24} /></button>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-emerald-600" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="font-black text-slate-800 text-sm bg-transparent focus:outline-none"/>
          </div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split('T')[0]); }} disabled={isToday} className={`p-2 ${isToday ? 'text-slate-100' : 'text-slate-400 hover:text-emerald-600'}`}><ChevronRight size={24} /></button>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleFinalizeClosing}
            disabled={transactions.length === 0 || isSaving}
            className={`flex-[1.5] px-4 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
              closingExists ? 'bg-slate-900 text-white' : 'bg-white border-2 border-emerald-600 text-emerald-600'
            } disabled:opacity-30`}
          >
            {isSaving ? 'Traitement...' : closingExists ? <><Printer size={18} /> Ré-imprimer Clôture</> : <><Save size={18} /> Valider & Archiver Clôture</>}
          </button>

          {isToday && (
            <button onClick={() => setShowAddForm(true)} className="flex-1 bg-emerald-600 text-white px-4 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
              <Plus size={18} /> Vente
            </button>
          )}
        </div>
      </div>

      <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className={`${isToday ? 'bg-emerald-600' : 'bg-slate-800'} p-6 text-white text-center space-y-1 transition-colors`}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{isToday ? "Recette du Jour" : `Recette du ${new Date(selectedDate).toLocaleDateString()}`}</p>
          <h2 className="text-4xl font-black tabular-nums tracking-tighter">{formatAr(dailyStats.total)}</h2>
          <p className="text-[10px] font-black uppercase text-emerald-100 mt-2">Bénéfice : {formatAr(dailyStats.profit)}</p>
        </div>
        <div className="grid grid-cols-3 divide-x border-t text-center p-3">
          <div className="py-2"><p className="text-[9px] font-bold text-slate-400">Espèces</p><p className="text-xs font-black text-emerald-600">{formatAr(dailyStats.cash)}</p></div>
          <div className="py-2"><p className="text-[9px] font-bold text-slate-400">M-Money</p><p className="text-xs font-black text-sky-600">{formatAr(dailyStats.mobile)}</p></div>
          <div className="py-2"><p className="text-[9px] font-bold text-slate-400">Crédits</p><p className="text-xs font-black text-orange-600">{formatAr(dailyStats.credit)}</p></div>
        </div>
      </section>

      {showAddForm && <QuickSaleForm onCancel={() => setShowAddForm(false)} onSave={() => { setShowAddForm(false); loadData(selectedDate); }} />}
      
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2"><History size={14} className="text-emerald-500" /> Journal des flux</h3>
        </div>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.method === PaymentMethod.ESPECES ? 'bg-emerald-50' : 'bg-sky-50'}`}>
                  {tx.type === 'invoice_payment' ? <FileText size={18} /> : <ShoppingBag size={18} />}
                </div>
                <div><p className="font-black text-slate-800 text-sm leading-none">{tx.label}</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{tx.clientName}</p></div>
              </div>
              <div className="text-right"><p className="font-black text-slate-800 text-sm">{formatAr(tx.amount)}</p><p className="text-[8px] font-black uppercase text-slate-300">{tx.method}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SalesJournal;
