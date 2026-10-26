import type { InvoiceRecord, PaymentTransaction } from '@kitchen-bots/types';

export class InvoicingEngine {
  private invoices: Map<string, InvoiceRecord> = new Map();
  private nextSequence: number = 1;

  /**
   * Generate an official sequential invoice from confirmed order data
   */
  public createInvoiceFromOrder(params: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    billingAddress: InvoiceRecord['billingAddress'];
    lineItems: Array<{
      name: string;
      sku?: string;
      hsnCode?: string;
      quantity: number;
      unitPricePaise: number;
    }>;
    dueDays?: number;
  }): InvoiceRecord {
    const seqStr = String(this.nextSequence++).padStart(4, '0');
    const invoiceNumber = `KB-INV-2026-${seqStr}`;

    const lineItems = params.lineItems.map(item => ({
      ...item,
      totalPaise: item.quantity * item.unitPricePaise,
    }));

    const subtotalPaise = lineItems.reduce((acc, item) => acc + item.totalPaise, 0);
    // Standard 18% GST for commercial foodservice machinery
    const taxGstPaise = Math.round(subtotalPaise * 0.18);
    const totalPaise = subtotalPaise + taxGstPaise;

    const issuedAt = new Date().toISOString();
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + (params.dueDays || 15));
    const dueDate = dueDateObj.toISOString();

    const invoice: InvoiceRecord = {
      id: `inv-${Date.now()}-${seqStr}`,
      invoiceNumber,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      billingAddress: params.billingAddress,
      lineItems,
      subtotalPaise,
      taxGstPaise,
      totalPaise,
      paidPaise: 0,
      balanceDuePaise: totalPaise,
      status: 'issued',
      dueDate,
      issuedAt,
      payments: [],
    };

    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  /**
   * Record a payment transaction and reconcile invoice balance
   */
  public recordPayment(params: {
    invoiceId: string;
    amountPaise: number;
    paymentMethod: PaymentTransaction['paymentMethod'];
    transactionReference: string;
    recordedBy?: string;
    notes?: string;
  }): { invoice: InvoiceRecord; payment: PaymentTransaction } {
    const invoice = this.invoices.get(params.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice not found for ID: ${params.invoiceId}`);
    }

    if (params.amountPaise <= 0) {
      throw new Error(`Payment amount must be greater than zero, got ${params.amountPaise}`);
    }

    if (params.amountPaise > invoice.balanceDuePaise) {
      throw new Error(
        `Payment of ${params.amountPaise} exceeds outstanding balance of ${invoice.balanceDuePaise}`
      );
    }

    const payment: PaymentTransaction = {
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceId: params.invoiceId,
      amountPaise: params.amountPaise,
      paymentMethod: params.paymentMethod,
      transactionReference: params.transactionReference,
      status: 'success',
      recordedBy: params.recordedBy,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    invoice.payments.push(payment);
    invoice.paidPaise += params.amountPaise;
    invoice.balanceDuePaise = Math.max(0, invoice.totalPaise - invoice.paidPaise);

    if (invoice.balanceDuePaise === 0) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partially_paid';
    }

    return { invoice, payment };
  }

  public getInvoice(id: string): InvoiceRecord | undefined {
    return this.invoices.get(id);
  }

  public getAllInvoices(): InvoiceRecord[] {
    return Array.from(this.invoices.values());
  }
}
