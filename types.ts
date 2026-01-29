
export enum BusinessDomain {
  COMMERCE = 'Commerce',
  SERVICES = 'Services'
}

export enum DocumentType {
  FACTURE = 'Facture',
  DEVIS = 'Devis',
  RECU = 'Reçu',
  CLOTURE = 'Clôture'
}

export enum InvoiceStatus {
  BROUILLON = 'Brouillon',
  VALIDE = 'Validé',
  PARTIEL = 'Partiel',
  PAYE = 'Payé',
  ANNULE = 'Annulé'
}

export enum PaymentMethod {
  ESPECES = 'Espèces',
  MOBILE_MONEY = 'Mobile Money',
  VIREMENT = 'Virement',
  CHEQUE = 'Chèque',
  CREDIT = 'Crédit (Non payé)'
}

export enum ClientType {
  INDIVIDUAL = 'Individuel',
  COMPANY = 'Société'
}

export interface Client {
  id?: number;
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  address?: string;
  nif?: string;
  stat?: string;
  notes?: string;
}

export interface Product {
  id?: number;
  name: string;
  unitPrice: number;
  purchasePrice: number;
  unit: string;
  stock: number;
  category?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  vatRate: number;
  unit?: string;
}

export interface Invoice {
  id?: number;
  number: string;
  date: string;
  dueDate: string;
  clientId: number;
  type: DocumentType;
  items: InvoiceItem[];
  subtotal: number;
  vatTotal: number;
  total: number;
  paidAmount: number;
  isPaid: boolean;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  domain: BusinessDomain;
  paidAt?: number;
}

export interface QuickSale {
  id?: number;
  timestamp: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  total: number;
  paymentMethod: PaymentMethod;
  clientName: string;
}

export interface PaymentTransaction {
  id?: number;
  timestamp: number;
  amount: number;
  method: PaymentMethod;
  referenceId: string | number;
  label: string;
  clientName: string;
  type: 'invoice_payment' | 'quick_sale';
}

export interface DailyClosing {
  id?: number;
  number: string;
  date: string;
  timestamp: number;
  totalRevenue: number;
  totalProfit: number;
  cashAmount: number;
  mobileAmount: number;
  creditAmount: number;
  transactionsCount: number;
  aggregatedProducts: {
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }[];
}

export interface UserSettings {
  id?: number;
  businessName: string;
  nif: string;
  stat: string;
  rcs: string;
  bankInfo?: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  defaultVat: number;
  currency: string;
  domain: BusinessDomain;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  nextClosingNumber: number;
  shopModeEnabled: boolean;
  showProfits: boolean;
}
