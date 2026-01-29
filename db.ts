
import { Dexie } from 'dexie';
import type { Table } from 'dexie';
import { Client, Product, Invoice, UserSettings, BusinessDomain, QuickSale, DailyClosing, PaymentTransaction } from './types';

export interface IMadaFactureDB extends Dexie {
  clients: Table<Client>;
  products: Table<Product>;
  invoices: Table<Invoice>;
  settings: Table<UserSettings>;
  sales: Table<QuickSale>;
  transactions: Table<PaymentTransaction>;
  closings: Table<DailyClosing>;
}

const baseDb = new Dexie('MadaFactureDB');

baseDb.version(6).stores({
  clients: '++id, name, email, nif, stat',
  products: '++id, name, unitPrice, category',
  invoices: '++id, number, date, clientId, type, total, status, paidAt',
  settings: '++id',
  sales: '++id, timestamp, productId, paymentMethod',
  transactions: '++id, timestamp, method, type, referenceId',
  closings: '++id, number, date, timestamp'
});

export const db = baseDb as IMadaFactureDB;

export async function requestPersistence(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    return await navigator.storage.persist();
  }
  return false;
}

export const initSettings = async () => {
  const count = await db.settings.count();
  if (count === 0) {
    await db.settings.add({
      businessName: 'MADA TRADING SARL',
      nif: '3000123456',
      stat: '45112 11 2023 0 00123',
      rcs: 'RCS TANA 2023 B 00987',
      bankInfo: 'BOA MADA: 00001 02100 12345678901 22',
      address: 'Enceinte Galaxy, Andraharo, Antananarivo',
      phone: '+261 34 11 222 33',
      email: 'contact@madatrading.mg',
      defaultVat: 0,
      currency: 'Ar',
      domain: BusinessDomain.COMMERCE,
      invoicePrefix: 'FACT-',
      nextInvoiceNumber: 200,
      nextClosingNumber: 1,
      shopModeEnabled: true,
      showProfits: true
    });
  }
};

export const populateTestData = async () => {
  const productCount = await db.products.count();
  if (productCount > 0) return;
  // ... (Test data logic remains same or similar)
};
