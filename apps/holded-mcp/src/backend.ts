import type { HoldedDocType } from './holded-client.js';

export interface HoldedBackend {
  listDocuments(docType: HoldedDocType, params?: Record<string, string>): Promise<unknown[]>;
  getDocument(docType: HoldedDocType, documentId: string): Promise<unknown>;
  createDocument(docType: HoldedDocType, body: Record<string, unknown>): Promise<unknown>;
  getDocumentPdf(docType: HoldedDocType, documentId: string): Promise<Buffer>;

  listContacts(params?: Record<string, string>): Promise<unknown[]>;
  getContact(contactId: string): Promise<unknown>;
  listContactFunnels(): Promise<unknown[]>;
  listLeads(funnelId?: string): Promise<unknown[]>;

  listProducts(params?: Record<string, string>): Promise<unknown[]>;
  getProduct(productId: string): Promise<unknown>;
  listProductsStock(params?: Record<string, string>): Promise<unknown[]>;
  listWarehouses(): Promise<unknown[]>;

  listTaxes(): Promise<unknown[]>;
  listNumberingSeries(): Promise<unknown[]>;

  listProjects(): Promise<unknown[]>;
  getProject(projectId: string): Promise<unknown>;
  listTasks(projectId: string): Promise<unknown[]>;
  listTimeRecords(projectId: string): Promise<unknown[]>;

  getChartOfAccounts(): Promise<unknown[]>;
  getDailyLedger(params?: Record<string, string>): Promise<unknown[]>;
  listEmployees(): Promise<unknown[] | Record<string, unknown>>;
  getEmployee(employeeId: string): Promise<unknown>;
  listTreasuryAccounts(): Promise<unknown[]>;
  listBankMovements(accountId: string, params?: Record<string, string>): Promise<unknown[]>;

  getVatReport(params: { year: string; period?: string }): Promise<unknown>;
  getBalanceSheet(params: { startDate: string; endDate: string }): Promise<unknown>;
  getProfitLoss(params: { startDate: string; endDate: string }): Promise<unknown>;
  listAccountingEntries(params?: Record<string, string>): Promise<unknown[]>;
  getAccountingEntry(entryId: string): Promise<unknown>;

  validateApiKey(): Promise<boolean>;
}
