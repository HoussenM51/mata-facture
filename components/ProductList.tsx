
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { Product, UserSettings } from '../types';
import { 
  Package, Plus, Search, AlertTriangle, TrendingUp, Edit2, 
  Save, BarChart3, Layers, Tag, ArrowUpRight, 
  ShoppingCart, Filter
} from 'lucide-react';
import { formatAr } from '../utils/formatters';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [unit, setUnit] = useState('Unité');
  const [stock, setStock] = useState(0);
  const [category, setCategory] = useState('');

  useEffect(() => { 
    loadProducts(); 
    db.settings.toCollection().first().then(s => setSettings(s || null));
  }, []);

  const loadProducts = async () => setProducts(await db.products.toArray());

  // Extraction des catégories uniques
  const categories = useMemo(() => {
    const cats = products.map(p => p.category || 'Non classé');
    return ['Toutes', ...Array.from(new Set(cats))].sort();
  }, [products]);

  const handleAdd = async () => {
    if (!name) return;
    await db.products.add({ 
      name, 
      unitPrice: price, 
      purchasePrice,
      unit, 
      stock,
      category: category || 'Général'
    });
    setName(''); setPrice(0); setPurchasePrice(0); setUnit('Unité'); setStock(0); setCategory('');
    setShowForm(false);
    loadProducts();
  };

  const handleUpdate = async () => {
    if (!editingProduct || !editingProduct.id) return;
    await db.products.update(editingProduct.id, {
      unitPrice: editingProduct.unitPrice,
      purchasePrice: editingProduct.purchasePrice,
      stock: editingProduct.stock,
      name: editingProduct.name,
      unit: editingProduct.unit,
      category: editingProduct.category || 'Général'
    });
    setEditingProduct(null);
    loadProducts();
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Toutes' || (p.category || 'Non classé') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const stockStats = {
    totalValue: products.reduce((acc, p) => acc + (p.unitPrice * (p.stock || 0)), 0),
    lowStockCount: products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length,
    outOfStockCount: products.filter(p => (p.stock || 0) <= 0).length
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto px-1">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <Layers size={18} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Gestion d'Inventaire</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Catalogue Articles</h2>
          <p className="text-sm text-slate-400 font-medium">{products.length} références actives.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:bg-slate-800 active:scale-95 transition-all group"
        >
          <Plus size={16} strokeWidth={3} /> Nouvel Article
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-emerald-600 p-4 rounded-[1.8rem] text-white flex items-center gap-4 shadow-lg shadow-emerald-100">
           <div className="bg-white/20 p-3 rounded-2xl"><BarChart3 size={20}/></div>
           <div>
             <p className="text-[10px] font-black uppercase opacity-60">Valeur Stock</p>
             <p className="text-lg font-black">{formatAr(stockStats.totalValue)}</p>
           </div>
        </div>
        <div className="bg-white p-4 rounded-[1.8rem] border border-amber-200 flex items-center gap-4 shadow-sm">
           <div className="bg-amber-50 p-3 rounded-2xl text-amber-500"><AlertTriangle size={20}/></div>
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400">Stock Bas</p>
             <p className="text-lg font-black text-slate-800">{stockStats.lowStockCount} articles</p>
           </div>
        </div>
        <div className="bg-white p-4 rounded-[1.8rem] border border-red-200 flex items-center gap-4 shadow-sm">
           <div className="bg-red-50 p-3 rounded-2xl text-red-500"><ShoppingCart size={20}/></div>
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400">Ruptures</p>
             <p className="text-lg font-black text-slate-800">{stockStats.outOfStockCount} articles</p>
           </div>
        </div>
      </div>

      <div className="space-y-4 sticky top-[68px] z-20 bg-slate-50/90 backdrop-blur-md -mx-1 px-1 py-2">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none transition-all focus:border-emerald-500"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-now8 py-2.5 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                selectedCategory === cat 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                : 'bg-white text-slate-400 border border-slate-100 hover:text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
          <h3 className="font-black text-slate-800 text-lg">Nouvel Article</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Désignation</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Catégorie</label>
              <input 
                list="category-suggestions"
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                placeholder="Ex: Boisson, Matériaux..."
                className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold" 
              />
              <datalist id="category-suggestions">
                {categories.filter(c => c !== 'Toutes').map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Unité</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold">
                <option value="Unité">Unité</option>
                <option value="Sac">Sac</option>
                <option value="Kg">Kg</option>
                <option value="Litre">Litre</option>
                <option value="Carton">Carton</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest ml-2">Prix Achat</label>
              <input type="number" value={purchasePrice || ''} onChange={e => setPurchasePrice(Number(e.target.value))} className="w-full p-4 bg-sky-50 border-0 rounded-2xl text-sm font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-2">Prix Vente</label>
              <input type="number" value={price || ''} onChange={e => setPrice(Number(e.target.value))} className="w-full p-4 bg-emerald-50 border-0 rounded-2xl text-sm font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Stock Initial</label>
              <input type="number" value={stock || ''} onChange={e => setStock(Number(e.target.value))} className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black">Valider</button>
            <button onClick={() => setShowForm(false)} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Annuler</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p => {
          const isOutOfStock = (p.stock || 0) <= 0;
          const isLowStock = (p.stock || 0) > 0 && (p.stock || 0) <= 5;
          const margin = p.unitPrice > 0 ? Math.round(((p.unitPrice - p.purchasePrice) / p.unitPrice) * 100) : 0;
          
          return (
            <div key={p.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-emerald-200 transition-all">
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOutOfStock ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Package size={24} />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-widest">{p.category || 'Général'}</span>
                  {settings?.showProfits && <span className="text-[9px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">{margin}% marge</span>}
                </div>
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-lg leading-tight line-clamp-2 min-h-[2.5rem]">{p.name}</h4>
                <p className={`text-[10px] font-black mt-1 ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-slate-400'}`}>
                  {p.stock} {p.unit} en stock
                </p>
              </div>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                <p className="text-xl font-black text-slate-900 tracking-tighter">{formatAr(p.unitPrice)}</p>
                <button onClick={() => setEditingProduct(p)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Edit2 size={18} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-800">Modifier Article</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Désignation</label>
                <input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                <input list="category-suggestions" value={editingProduct.category || ''} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Prix Vente</label>
                  <input type="number" value={editingProduct.unitPrice} onChange={e => setEditingProduct({...editingProduct, unitPrice: Number(e.target.value)})} className="w-full p-4 bg-emerald-50 rounded-2xl text-sm font-black text-emerald-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock</label>
                  <input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-black text-slate-800" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleUpdate} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black">Enregistrer</button>
              <button onClick={() => setEditingProduct(null)} className="w-full py-2 text-slate-400 font-bold text-xs">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
