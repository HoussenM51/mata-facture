
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { DocumentType, Invoice, InvoiceItem, Client, Product, UserSettings, InvoiceStatus, BusinessDomain, PaymentMethod, PaymentTransaction } from '../types';
import { 
  Plus, ChevronLeft, Search, Check, Minus, Users, Wallet, Banknote, Smartphone, CreditCard,
  FileText, Package, Layers, X, Info
} from 'lucide-react';
import { formatAr } from '../utils/formatters';

interface InvoiceFormProps {
  onSave: () => void;
  onCancel: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, onCancel }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [type, setType] = useState<DocumentType>(DocumentType.FACTURE);
  const [clientId, setClientId] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('');
  const [payNow, setPayNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ESPECES);

  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [productSearch, setProductSearch] = useState('');
  const [showCatalogue, setShowCatalogue] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [s, c, p] = await Promise.all([
        db.settings.toCollection().first(),
        db.clients.toArray(),
        db.products.toArray()
      ]);
      
      setSettings(s || null);
      setClients(c);
      setProducts(p.sort((a, b) => a.name.localeCompare(b.name)));
      
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setDueDate(d.toISOString().split('T')[0]);
    };
    loadData();
  }, []);

  const categories = useMemo(() => {
    const cats = products.map(p => p.category || 'Non classé');
    return ['Toutes', ...Array.from(new Set(cats))].sort();
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = selectedCategory === 'Toutes' || (p.category || 'Non classé') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const vatTotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.vatRate / 100)), 0);
    return { subtotal, vatTotal, total: subtotal + vatTotal };
  }, [items]);

  const invoiceNumber = useMemo(() => {
    if (!settings) return '...';
    const year = new Date(date).getFullYear();
    const prefix = type === DocumentType.DEVIS ? 'DEV-' : settings.invoicePrefix;
    return `${prefix}${year}-${String(settings.nextInvoiceNumber).padStart(3, '0')}`;
  }, [settings, date, type]);

  const addProductToInvoice = (product: Product) => {
    const existingIndex = items.findIndex(item => item.description === product.name);
    
    if (existingIndex > -1) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      setItems(newItems);
    } else {
      setItems([...items, { 
        id: crypto.randomUUID(), 
        description: product.name, 
        quantity: 1, 
        unitPrice: product.unitPrice, 
        purchasePrice: product.purchasePrice,
        unit: product.unit || 'Unité',
        vatRate: settings?.defaultVat || 0 
      }]);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (clientId === 0) { alert("Veuillez choisir un client."); return; }
    if (items.length === 0) { alert("La facture est vide."); return; }
    if (!settings) return;

    setIsSubmitting(true);
    const nowTimestamp = Date.now();
    
    try {
      const finalStatus = payNow ? InvoiceStatus.PAYE : InvoiceStatus.VALIDE;
      
      const newInvoice: Invoice = {
        number: invoiceNumber,
        date,
        dueDate,
        clientId,
        type,
        items,
        subtotal: totals.subtotal,
        vatTotal: totals.vatTotal,
        total: totals.total,
        paidAmount: payNow ? totals.total : 0,
        isPaid: payNow,
        status: finalStatus,
        paymentMethod: payNow ? paymentMethod : undefined,
        paidAt: payNow ? nowTimestamp : undefined,
        notes,
        domain: settings.domain
      };

      const invoiceId = await db.invoices.add(newInvoice);

      if (type === DocumentType.FACTURE || type === DocumentType.RECU) {
        for (const item of items) {
          const product = products.find(p => p.name === item.description);
          if (product && product.id) {
            await db.products.update(product.id, {
              stock: (product.stock || 0) - item.quantity
            });
          }
        }

        if (payNow) {
          const client = clients.find(c => c.id === clientId);
          await db.transactions.add({
            timestamp: nowTimestamp,
            amount: totals.total,
            method: paymentMethod,
            referenceId: invoiceId as number,
            label: invoiceNumber,
            clientName: client?.name || 'Client inconnu',
            type: 'invoice_payment'
          });
        }
      }

      await db.settings.update(settings.id!, { nextInvoiceNumber: settings.nextInvoiceNumber + 1 });
      onSave();
    } catch (e) {
      console.error(e);
      alert("Erreur d'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-32 max-w-4xl mx-auto">
      {/* HEADER FIXE */}
      <div className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-md -mx-4 px-4 py-3 border-b flex items-center justify-between shadow-sm">
        <button onClick={onCancel} className="p-2 bg-white rounded-full shadow-sm border text-slate-600">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">{type} {invoiceNumber}</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase">{items.length} lignes d'articles</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSubmitting || items.length === 0}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-100 disabled:opacity-30 transition-all"
        >
          {isSubmitting ? '...' : <><Check size={16} /> VALIDER</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLONNE GAUCHE: CATALOGUE (Sur Desktop) / SECTION HAUTE (Mobile) */}
        <div className="lg:col-span-5 space-y-4 order-2 lg:order-1">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden sticky top-20">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-emerald-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Catalogue Articles</h3>
              </div>
              <button onClick={() => setShowCatalogue(!showCatalogue)} className="text-slate-400 hover:text-white transition-colors">
                {showCatalogue ? <Minus size={16}/> : <Plus size={16}/>}
              </button>
            </div>
            
            {showCatalogue && (
              <div className="p-4 space-y-4 animate-in slide-in-from-top duration-300">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    placeholder="Chercher dans le stock..." 
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-0 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all" 
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                        selectedCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                  {filteredProducts.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => addProductToInvoice(p)}
                      className="bg-slate-50 p-3 rounded-2xl border border-transparent hover:border-emerald-200 hover:bg-emerald-50 text-left transition-all active:scale-[0.97]"
                    >
                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">{p.category || 'Général'}</span>
                      <p className="font-black text-slate-800 text-[10px] leading-tight line-clamp-2 my-1">{p.name}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-emerald-600">{formatAr(p.unitPrice)}</span>
                        <span className={`text-[8px] font-bold ${ (p.stock || 0) <= 5 ? 'text-red-500' : 'text-slate-400'}`}>S:{p.stock}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE: FACTURE EN COURS */}
        <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
          {/* CLIENT & TYPE */}
          <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
              {Object.values(DocumentType).map(t => (
                <button key={t} onClick={() => setType(t)} className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${type === t ? 'bg-white text-emerald-600 shadow-sm border border-emerald-50' : 'text-slate-400'}`}>{t}</button>
              ))}
            </div>

            <div className="relative group">
              <select 
                value={clientId}
                onChange={(e) => setClientId(Number(e.target.value))}
                className={`w-full bg-slate-50 border-0 rounded-2xl p-4 pr-10 text-sm transition-all focus:ring-2 focus:ring-emerald-500 outline-none ${clientId === 0 ? 'text-slate-400 italic' : 'text-slate-900 font-black'}`}
              >
                <option value={0}>SÉLECTIONNER UN CLIENT...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300"><Users size={20} /></div>
            </div>
          </section>

          {/* LISTE DES ARTICLES SELECTIONNES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Package size={14} className="text-emerald-500" /> Articles Facturés
              </h3>
              {items.length > 0 && <button onClick={() => setItems([])} className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase">Vider la liste</button>}
            </div>

            <div className="space-y-3">
              {items.length > 0 ? items.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-[1.8rem] border border-slate-100 shadow-sm flex items-center justify-between group animate-in slide-in-from-right duration-300">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-black text-slate-800 text-sm leading-tight truncate">{item.description}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                      {formatAr(item.unitPrice)} / {item.unit || 'u'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center bg-slate-50 rounded-xl px-1">
                      <button onClick={() => updateItemQuantity(item.id, -1)} className="p-2 text-slate-400 hover:text-red-500"><Minus size={14}/></button>
                      <span className="w-8 text-center font-black text-sm text-slate-800">{item.quantity}</span>
                      <button onClick={() => updateItemQuantity(item.id, 1)} className="p-2 text-slate-400 hover:text-emerald-600"><Plus size={14}/></button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-black text-slate-900">{formatAr(item.quantity * item.unitPrice)}</p>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="bg-white/50 border-2 border-dashed border-slate-100 rounded-[2.5rem] py-12 flex flex-col items-center justify-center text-slate-300">
                  <Package size={32} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Utilisez le catalogue pour ajouter des articles</p>
                </div>
              )}
            </div>
          </div>

          {/* OPTIONS DE REGLEMENT */}
          {(type === DocumentType.FACTURE || type === DocumentType.RECU) && items.length > 0 && (
            <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-emerald-100 space-y-5 animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payNow ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Wallet size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">Paiement Immédiat</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Enregistrer l'encaissement en caisse</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPayNow(!payNow)}
                  className={`w-12 h-6 rounded-full transition-all relative ${payNow ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${payNow ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              {payNow && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-200">
                  {[
                    { id: PaymentMethod.ESPECES, label: 'Cash', icon: <Banknote size={16}/> },
                    { id: PaymentMethod.MOBILE_MONEY, label: 'M-Money', icon: <Smartphone size={16}/> },
                    { id: PaymentMethod.VIREMENT, label: 'Virement', icon: <CreditCard size={16}/> },
                    { id: PaymentMethod.CHEQUE, label: 'Chèque', icon: <FileText size={16}/> }
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        paymentMethod === method.id ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-400'
                      }`}
                    >
                      {method.icon}
                      <span className="text-[8px] font-black uppercase tracking-tighter">{method.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* RÉSUMÉ FINANCIER */}
          <section className="bg-slate-900 text-white p-7 rounded-[2.5rem] shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
              <span>NET À PAYER ({settings?.currency || 'Ar'})</span>
              <span className="text-emerald-400">Total TTC</span>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-4xl font-black tracking-tighter tabular-nums">{formatAr(totals.total)}</p>
              {payNow && <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1"><Info size={10}/> À Encaisser</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
