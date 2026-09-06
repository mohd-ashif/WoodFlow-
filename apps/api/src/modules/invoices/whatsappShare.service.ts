import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

// ─── 1. PHONE NUMBER NORMALIZATION UTILITY ────────────────────────────────────

export interface PhoneValidationResult {
  isValid: boolean;
  rawNumber: string;
  normalizedNumber: string;
  formattedDisplay: string;
  errorReason?: string;
}

export function normalizePhoneNumber(
  rawPhone: string | null | undefined,
  defaultCountryCode = '91'
): PhoneValidationResult {
  if (!rawPhone || !rawPhone.trim()) {
    return {
      isValid: false,
      rawNumber: rawPhone || '',
      normalizedNumber: '',
      formattedDisplay: '',
      errorReason: 'Customer WhatsApp phone number is missing.',
    };
  }

  // Remove all non-numeric characters except +
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, '');

  // Strip leading +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Strip leading 0s (e.g. 09876543210 -> 9876543210)
  while (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If 10 digits (Standard Indian mobile number), prepend default country code (91)
  if (cleaned.length === 10) {
    cleaned = `${defaultCountryCode}${cleaned}`;
  }

  // Basic international length check (10 to 15 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return {
      isValid: false,
      rawNumber: rawPhone,
      normalizedNumber: cleaned,
      formattedDisplay: rawPhone,
      errorReason: 'Phone number format appears invalid for WhatsApp.',
    };
  }

  // Formatted display (e.g. +91 98765 43210)
  const display = `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;

  return {
    isValid: true,
    rawNumber: rawPhone,
    normalizedNumber: cleaned,
    formattedDisplay: display,
  };
}

// ─── 2. WHATSAPP TEMPLATE ENGINE ──────────────────────────────────────────────

export interface InvoiceTemplateVariables {
  customerName: string;
  companyName: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: string;
  paidAmount: string;
  balanceDue: string;
  invoiceUrl: string;
}

export const DEFAULT_WHATSAPP_TEMPLATE =
  `Hello {{customerName}},\n\n` +
  `Thank you for your business with {{companyName}}.\n\n` +
  `Your invoice {{invoiceNumber}} has been generated.\n\n` +
  `Invoice Date: {{invoiceDate}}\n` +
  `Total Amount: ₹{{totalAmount}}\n` +
  `Amount Paid: ₹{{paidAmount}}\n` +
  `Balance Due: ₹{{balanceDue}}\n\n` +
  `View Invoice:\n{{invoiceUrl}}\n\n` +
  `Thank you,\n{{companyName}}`;

export function renderWhatsAppTemplate(
  templateStr: string,
  vars: InvoiceTemplateVariables
): string {
  let message = templateStr || DEFAULT_WHATSAPP_TEMPLATE;
  message = message.replace(/\{\{customerName\}\}/g, vars.customerName || 'Customer');
  message = message.replace(/\{\{companyName\}\}/g, vars.companyName || 'Furniture Shop');
  message = message.replace(/\{\{invoiceNumber\}\}/g, vars.invoiceNumber || '');
  message = message.replace(/\{\{invoiceDate\}\}/g, vars.invoiceDate || '');
  message = message.replace(/\{\{totalAmount\}\}/g, vars.totalAmount || '0');
  message = message.replace(/\{\{paidAmount\}\}/g, vars.paidAmount || '0');
  message = message.replace(/\{\{balanceDue\}\}/g, vars.balanceDue || '0');
  message = message.replace(/\{\{invoiceUrl\}\}/g, vars.invoiceUrl || '');
  return message;
}

// ─── 3. PROVIDER ABSTRACTION FOR FUTURE CLOUD API PLUGINS ──────────────────────

export interface WhatsAppSharePayload {
  whatsappUrl: string;
  prefilledMessage: string;
  normalizedPhone: string;
  formattedDisplayPhone: string;
  invoiceUrl: string;
  phoneValid: boolean;
  errorReason?: string;
  customerName?: string;
  customerPhone?: string;
}

export interface WhatsAppProvider {
  generateSharePayload(
    phoneResult: PhoneValidationResult,
    templateVars: InvoiceTemplateVariables,
    customTemplate?: string
  ): WhatsAppSharePayload;
}

export class ClickToChatProvider implements WhatsAppProvider {
  generateSharePayload(
    phoneResult: PhoneValidationResult,
    templateVars: InvoiceTemplateVariables,
    customTemplate?: string
  ): WhatsAppSharePayload {
    const prefilledMessage = renderWhatsAppTemplate(
      customTemplate || DEFAULT_WHATSAPP_TEMPLATE,
      templateVars
    );

    if (!phoneResult.isValid) {
      return {
        whatsappUrl: '',
        prefilledMessage,
        normalizedPhone: phoneResult.normalizedNumber,
        formattedDisplayPhone: phoneResult.formattedDisplay,
        invoiceUrl: templateVars.invoiceUrl,
        phoneValid: false,
        errorReason: phoneResult.errorReason,
        customerName: templateVars.customerName,
        customerPhone: phoneResult.rawNumber,
      };
    }

    const encodedText = encodeURIComponent(prefilledMessage);
    const whatsappUrl = `https://wa.me/${phoneResult.normalizedNumber}?text=${encodedText}`;

    return {
      whatsappUrl,
      prefilledMessage,
      normalizedPhone: phoneResult.normalizedNumber,
      formattedDisplayPhone: phoneResult.formattedDisplay,
      invoiceUrl: templateVars.invoiceUrl,
      phoneValid: true,
      customerName: templateVars.customerName,
      customerPhone: phoneResult.rawNumber,
    };
  }
}

const defaultProvider: WhatsAppProvider = new ClickToChatProvider();

// ─── 4. INVOICE PUBLIC SHARE SERVICE ──────────────────────────────────────────

export async function getOrCreatePublicToken(companyId: string, invoiceId: string): Promise<string> {
  const db = prisma as any;
  try {
    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, companyId },
      select: { id: true, publicToken: true },
    });

    if (!invoice) {
      return invoiceId;
    }

    if (invoice.publicToken) {
      return invoice.publicToken;
    }

    // Generate cryptographically random token
    const token = crypto.randomBytes(16).toString('hex');
    await db.invoice.update({
      where: { id: invoiceId },
      data: { publicToken: token },
    }).catch(() => {});

    return token || invoiceId;
  } catch (err) {
    // Fallback if publicToken column is not yet pushed to physical DB
    return invoiceId;
  }
}

export async function prepareInvoiceWhatsAppShare(
  companyId: string,
  invoiceId: string,
  appBaseUrl: string,
  customMessage?: string,
  updatedPhone?: string
): Promise<WhatsAppSharePayload> {
  const db = prisma as any;

  let invoice: any = null;
  try {
    invoice = await db.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        company: { select: { name: true, phone: true } },
        customer: { select: { id: true, name: true, phone: true } },
        sale: { select: { customerId: true, totalAmount: true, paidAmount: true, dueAmount: true, saleDate: true } },
      },
    });
  } catch {
    invoice = await db.invoice.findFirst({
      where: { id: invoiceId, companyId },
    });
  }

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  // 1. Locate linked or matching customer record safely
  let customerObj = invoice.customer || null;
  if (!customerObj && invoice.sale?.customerId) {
    try {
      customerObj = await db.customer.findFirst({
        where: { id: invoice.sale.customerId, companyId },
        select: { id: true, name: true, phone: true },
      });
    } catch {}
  }
  if (!customerObj && invoice.customerNameSnapshot) {
    try {
      const normSearch = invoice.customerNameSnapshot.trim().toLowerCase();
      const allCustomers = await db.customer.findMany({
        where: { companyId },
        select: { id: true, name: true, phone: true },
        take: 200,
      });
      customerObj = allCustomers.find(
        (c: any) => c.name && c.name.trim().toLowerCase() === normSearch
      ) || null;
    } catch {}
  }

  // 2. If updatedPhone was passed from modal, save to customer & invoice
  let activePhone = updatedPhone ? updatedPhone.trim() : null;

  if (activePhone) {
    // If customer record doesn't exist yet, auto-create customer record
    if (!customerObj && invoice.customerNameSnapshot) {
      try {
        const custCode = `CUST-${Math.floor(100000 + Math.random() * 900000)}`;
        customerObj = await db.customer.create({
          data: {
            companyId,
            name: invoice.customerNameSnapshot.trim(),
            phone: activePhone,
            customerCode: custCode,
          },
          select: { id: true, name: true, phone: true },
        });
      } catch {}
    } else if (customerObj?.id) {
      await db.customer.update({
        where: { id: customerObj.id },
        data: { phone: activePhone },
      }).catch(() => {});
      customerObj.phone = activePhone;
    }

    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        customerId: customerObj?.id || invoice.customerId || undefined,
        customerPhoneSnapshot: activePhone,
      },
    }).catch(() => {});
  } else {
    // Determine live customer phone number
    const livePhone = customerObj?.phone?.trim();
    activePhone = livePhone || invoice.customerPhoneSnapshot || null;

    // Auto-link customer ID and sync snapshot if needed
    if (customerObj?.id) {
      const updateData: any = {};
      if (!invoice.customerId || invoice.customerId !== customerObj.id) {
        updateData.customerId = customerObj.id;
      }
      if (livePhone && invoice.customerPhoneSnapshot !== livePhone) {
        updateData.customerPhoneSnapshot = livePhone;
      }
      if (Object.keys(updateData).length > 0) {
        await db.invoice.update({
          where: { id: invoiceId },
          data: updateData,
        }).catch(() => {});
      }
    }
  }

  const liveCustomerName = customerObj?.name?.trim();
  const customerName = liveCustomerName || invoice.customerNameSnapshot || 'Valued Customer';

  // Get or create public access token (with fallback)
  const publicToken = await getOrCreatePublicToken(companyId, invoiceId);
  const cleanBaseUrl = (appBaseUrl || 'http://localhost:3000').replace(/\/$/, '');
  const invoicePublicUrl = publicToken ? `${cleanBaseUrl}/public/invoices/${publicToken}` : `${cleanBaseUrl}/invoices/${invoiceId}`;

  // Customer Phone Normalization
  const phoneResult = normalizePhoneNumber(activePhone);

  const formattedDate = new Date(invoice.invoiceDate || invoice.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const templateVars: InvoiceTemplateVariables = {
    customerName,
    companyName: invoice.company?.name || 'Furniture Shop',
    invoiceNumber: invoice.invoiceNumber || 'INV-0001',
    invoiceDate: formattedDate,
    totalAmount: (invoice.totalAmount || 0).toLocaleString('en-IN'),
    paidAmount: (invoice.sale?.paidAmount || 0).toLocaleString('en-IN'),
    balanceDue: (invoice.sale?.dueAmount || 0).toLocaleString('en-IN'),
    invoiceUrl: invoicePublicUrl,
  };

  return defaultProvider.generateSharePayload(phoneResult, templateVars, customMessage);
}
