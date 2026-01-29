
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../db';
import { Product, QuickSale, PaymentMethod, PaymentTransaction } from '../types';
import { ChevronLeft, Check, Minus, Plus, Search, User, CreditCard, Wallet, AlertCircle, Package, Zap, Filter } from 'lucide-react';
import { formatAr } from '../utils/formatters';

interface QuickSaleFormProps {
  onCancel: () => void;
  onSave: () => void;
}

const QuickSaleForm: React.FC<QuickSaleFormProps> = ({ onCancel, onSave }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [clientName, setClientName] = useState('Client de passage');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ESPECES);
  const [isSaving, setIsSaving] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.products.toArray().then(items => {
      setProducts(items.sort((a, b) => (b.stock || 0) - (a.stock || 0)));
    });
    searchInputRef.current?.focus();
  }, []);

  const categories = useMemo(() => {
    const cats = products.map(p => p.category || 'Non classé');
    return ['Toutes', ...Array.from(new Set(cats))].sort();
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'Toutes' || (p.category || 'Non classé') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSave = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    const now = Date.now();
    try {
      const total = quantity * selectedProduct.unitPrice;
      const sale: QuickSale = {
        timestamp: now,
        productId: selectedProduct.id!,
        productName: selectedProduct.name,
        quantity,
        unitPrice: selectedProduct.unitPrice,
        purchasePrice: selectedProduct.purchasePrice,
        total,
        paymentMethod,
        clientName
      };
      await db.sales.add(sale);
      const transaction: PaymentTransaction = {
        timestamp: now,
        amount: total,
        method: paymentMethod,
        referenceId: 'VENTE-RAPIDE',
        label: `${selectedProduct.name} (x${quantity})`,
        clientName: clientName,
        type: 'quick_sale'
      };
      await db.transactions.add(transaction);
      await db.products.update(selectedProduct.id!, {
        stock: (selectedProduct.stock || 0) - quantity
      });
      onSave();
    } catch (e) {
      alert("Erreur lors de la vente");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <button onClick={onCancel} className="p-2 text-slate-400"><ChevronLeft size={24} /></button>
        <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">Vente Rapide</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {!selectedProduct && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rechercher un article</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  ref={searchInputRef}
                  placeholder="Nom du produit..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-0 rounded-2xl shadow-sm text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-left flex flex-col justify-between gap-3 active:scale-[0.96] transition-all"
                >
                  <div>
                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{p.category || 'Général'}</span>
                    <p className="font-black text-slate-800 text-xs leading-tight line-clamp-2 mt-0.5">{p.name}</p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-1">{formatAr(p.unitPrice)}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                    <span className="text-[8px] font-black text-slate-400">Stock: {p.stock}</span>
                    <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Plus size={14} /></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedProduct && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-600 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
               <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-emerald-500/50 p-1.5 rounded-full"><ChevronLeft className="rotate-90" size={16} /></button>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{selectedProduct.category || 'Général'}</p>
               <h3 className="text-xl font-black mt-1 leading-tight">{selectedProduct.name}</h3>
               <div className="flex items-center justify-between mt-4 pt-4 border-t border-emerald-500/30">
                 <p className="text-sm font-bold">{formatAr(selectedProduct.unitPrice)}</p>
                 <p className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg">Stock: {selectedProduct.stock}</p>
               </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantité à vendre</label>
              <div className="flex items-center justify-between bg-white p-4 rounded-[2rem] shadow-sm border border-emerald-100">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><Minus size={24} /></button>
                <div className="text-center">
                  <p className="text-4xl font-black text-slate-800 tabular-nums">{quantity}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedProduct.unit}</p>
                </div>
                <button onClick={() => setQuantity(Math.min(selectedProduct.stock || 999, quantity + 1))} className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><Plus size={24} /></button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: PaymentMethod.ESPECES, label: 'Cash', icon: <Wallet size={18}/> },
                { id: PaymentMethod.MOBILE_MONEY, label: 'M-Money', icon: <CreditCard size={18}/> },
                { id: PaymentMethod.CREDIT, label: 'Crédit', icon: <AlertCircle size={18}/> }
              ].map(method => (
                <button 
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-1 ${
                    paymentMethod === method.id ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-50 text-slate-400'
                  }`}
                >
                  {method.icon}
                  <span className="text-[9px] font-black uppercase tracking-tight">{method.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du client</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-4 bg-white border-0 rounded-2xl shadow-sm text-sm font-bold outline-none" />
            </div>
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="bg-white p-4 border-t shadow-lg pb-8">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Total Transaction</span>
            <span className="text-xl font-black text-emerald-600">{formatAr(quantity * selectedProduct.unitPrice)}</span>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-emerald-600 text-white py-5 rounded-[1.8rem] font-black text-lg shadow-xl active:scale-95 transition-all"
          >
            {isSaving ? '...' : <Check size={28} className="inline mr-2" />} Confirmer
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickSaleForm;
