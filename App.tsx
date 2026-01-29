
import React, { useState } from 'react';
import { LayoutDashboard, FileText, Users, Package, Settings as SettingsIcon, Plus, BookOpen, History, ReceiptText } from 'lucide-react';
import DashboardView from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import ProductList from './components/ProductList';
import SettingsView from './components/SettingsView';
import SalesJournal from './components/SalesJournal';
import ClosingArchive from './components/ClosingArchive';
import { useOnlineStatus } from './hooks/useOnlineStatus';

type View = 'dashboard' | 'invoices' | 'clients' | 'products' | 'settings' | 'new-invoice' | 'cahier' | 'client-detail' | 'closings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const isOnline = useOnlineStatus();

  const handleViewClient = (id: number) => {
    setSelectedClientId(id);
    setCurrentView('client-detail');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView onAction={(v) => setCurrentView(v as View)} />;
      case 'invoices': return <InvoiceList onNew={() => setCurrentView('new-invoice')} />;
      case 'new-invoice': return <InvoiceForm onSave={() => setCurrentView('invoices')} onCancel={() => setCurrentView('invoices')} />;
      case 'clients': return <ClientList onSelectClient={handleViewClient} />;
      case 'client-detail': 
        return selectedClientId ? (
          <ClientDetail clientId={selectedClientId} onBack={() => setCurrentView('clients')} />
        ) : <ClientList onSelectClient={handleViewClient} />;
      case 'products': return <ProductList />;
      case 'closings': return <ClosingArchive />;
      case 'settings': return <SettingsView />;
      case 'cahier': return <SalesJournal />;
      default: return <DashboardView onAction={(v) => setCurrentView(v as View)} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Accueil', icon: <LayoutDashboard size={20} /> },
    { id: 'cahier', label: 'Cahier', icon: <BookOpen size={20} /> },
    { id: 'invoices', label: 'Facturation', icon: <ReceiptText size={20} /> },
    { id: 'clients', label: 'Clients', icon: <Users size={20} /> },
    { id: 'products', label: 'Stock', icon: <Package size={20} /> },
    { id: 'closings', label: 'Archives', icon: <History size={20} /> },
    { id: 'settings', label: 'Réglages', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-100">M</div>
          <div>
            <h1 className="font-black text-slate-800 tracking-tight leading-none">MadaFacture</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Édition Boutique</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                currentView === item.id || (item.id === 'clients' && currentView === 'client-detail') || (item.id === 'invoices' && currentView === 'new-invoice')
                  ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <span className={currentView === item.id || (item.id === 'clients' && currentView === 'client-detail') || (item.id === 'invoices' && currentView === 'new-invoice') ? 'text-emerald-600' : 'text-slate-400'}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 md:bg-white">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <h1 className="font-bold text-lg tracking-tight text-slate-800">MadaFacture</h1>
          </div>
          <div className="hidden md:block">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
              {navItems.find(n => n.id === currentView)?.label || (currentView === 'new-invoice' ? 'Nouvelle Facture' : 'Détails')}
            </h2>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${isOnline ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></span>
            {isOnline ? 'En ligne' : 'Offline'}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-6 bg-slate-50/50">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {renderView()}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t flex justify-around items-center py-3 px-1 z-20 shadow-lg">
          {navItems.map((item) => (
            <NavButton 
              key={item.id}
              active={currentView === item.id || (item.id === 'clients' && currentView === 'client-detail') || (item.id === 'invoices' && currentView === 'new-invoice')} 
              icon={item.icon} 
              label={item.label} 
              onClick={() => setCurrentView(item.id as View)} 
            />
          ))}
        </nav>
      </div>
    </div>
  );
};

interface NavButtonProps { active: boolean; icon: React.ReactNode; label: string; onClick: () => void; }
const NavButton: React.FC<NavButtonProps> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center py-1 w-full gap-1 transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
    {icon}
    <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;
