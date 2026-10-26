import { describe, it } from 'node:test';
import assert from 'node:assert';
import { InventoryLedgerEngine } from './inventory-ledger';
import { InvoicingEngine } from './invoicing-engine';

describe('InventoryLedgerEngine (Isolated Environment)', () => {
  it('correctly calculates available stock = onHand - reserved', () => {
    const ledger = new InventoryLedgerEngine([
      { sku: 'KB-TEST-ROBOT', reorderThreshold: 3, warehouseLocation: 'Bay 2' },
    ]);

    // 1. Initial balance is 0
    let balance = ledger.getBalance('p1', 'KB-TEST-ROBOT');
    assert.strictEqual(balance.onHand, 0);
    assert.strictEqual(balance.reserved, 0);
    assert.strictEqual(balance.available, 0);
    assert.strictEqual(balance.isOutOfStock, true);

    // 2. Intake 10 units via receipt
    ledger.recordMovement({
      productId: 'p1',
      sku: 'KB-TEST-ROBOT',
      movementType: 'receipt',
      quantity: 10,
      notes: 'Initial production batch received',
    });

    balance = ledger.getBalance('p1', 'KB-TEST-ROBOT');
    assert.strictEqual(balance.onHand, 10);
    assert.strictEqual(balance.reserved, 0);
    assert.strictEqual(balance.available, 10);
    assert.strictEqual(balance.isOutOfStock, false);

    // 3. Reserve 3 units for a commercial order
    ledger.recordMovement({
      productId: 'p1',
      sku: 'KB-TEST-ROBOT',
      movementType: 'reservation',
      quantity: 3,
      referenceType: 'order',
      referenceId: 'ord-101',
    });

    balance = ledger.getBalance('p1', 'KB-TEST-ROBOT');
    assert.strictEqual(balance.onHand, 10);
    assert.strictEqual(balance.reserved, 3);
    assert.strictEqual(balance.available, 7); // 10 - 3 = 7

    // 4. Prevent over-reservation (try to reserve 8 when only 7 available)
    assert.throws(() => {
      ledger.recordMovement({
        productId: 'p1',
        sku: 'KB-TEST-ROBOT',
        movementType: 'reservation',
        quantity: 8,
      });
    }, /Insufficient available stock/);

    // 5. Release 1 unit (order partial cancellation)
    ledger.recordMovement({
      productId: 'p1',
      sku: 'KB-TEST-ROBOT',
      movementType: 'release',
      quantity: 1,
    });

    balance = ledger.getBalance('p1', 'KB-TEST-ROBOT');
    assert.strictEqual(balance.reserved, 2);
    assert.strictEqual(balance.available, 8);

    // 6. Deduct 2 units for dispatch
    ledger.recordMovement({
      productId: 'p1',
      sku: 'KB-TEST-ROBOT',
      movementType: 'deduction',
      quantity: 2,
      referenceType: 'order',
      referenceId: 'ord-101',
    });

    balance = ledger.getBalance('p1', 'KB-TEST-ROBOT');
    assert.strictEqual(balance.onHand, 8);
    assert.strictEqual(balance.reserved, 0);
    assert.strictEqual(balance.available, 8);

    // 7. Verify low-stock alert when below threshold
    ledger.recordMovement({
      productId: 'p1',
      sku: 'KB-TEST-ROBOT',
      movementType: 'deduction',
      quantity: 6,
    });

    balance = ledger.getBalance('p1', 'KB-TEST-ROBOT');
    assert.strictEqual(balance.available, 2);
    assert.strictEqual(balance.isLowStock, true); // threshold is 3
  });
});

describe('InvoicingEngine (Isolated Environment)', () => {
  it('creates persistent invoice with standard GST (18%) and reconciles partial payments', () => {
    const engine = new InvoicingEngine();

    const invoice = engine.createInvoiceFromOrder({
      orderId: 'ord-901',
      orderNumber: 'KB-ORD-TEST-901',
      customerName: 'Industrial Caterers Ltd',
      customerEmail: 'finance@caterers.com',
      billingAddress: {
        fullName: 'Industrial Caterers Ltd',
        phone: '+91 9888877777',
        addressLine1: 'Plot 44, Food Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560066',
        country: 'India',
        gstin: '29ABCDE1234F1Z5',
      },
      lineItems: [
        {
          name: 'Automatic Wok Machine',
          sku: 'KB-WOK-001',
          quantity: 2,
          unitPricePaise: 10000000, // ₹1,00,000 each = ₹2,00,000
        },
      ],
      dueDays: 30,
    });

    assert.strictEqual(invoice.invoiceNumber, 'KB-INV-2026-0001');
    assert.strictEqual(invoice.subtotalPaise, 20000000); // ₹2,00,000
    assert.strictEqual(invoice.taxGstPaise, 3600000);     // 18% = ₹36,000
    assert.strictEqual(invoice.totalPaise, 23600000);      // Total = ₹2,36,000
    assert.strictEqual(invoice.balanceDuePaise, 23600000);
    assert.strictEqual(invoice.status, 'issued');

    // Record partial advance payment (50%)
    const partialPay = engine.recordPayment({
      invoiceId: invoice.id,
      amountPaise: 11800000, // ₹1,18,000
      paymentMethod: 'bank_neft',
      transactionReference: 'NEFT-AXIS-9921440',
      recordedBy: 'Accounts Clerk #12',
    });

    assert.strictEqual(partialPay.invoice.status, 'partially_paid');
    assert.strictEqual(partialPay.invoice.paidPaise, 11800000);
    assert.strictEqual(partialPay.invoice.balanceDuePaise, 11800000);

    // Record final balance settlement
    const finalPay = engine.recordPayment({
      invoiceId: invoice.id,
      amountPaise: 11800000,
      paymentMethod: 'bank_neft',
      transactionReference: 'NEFT-AXIS-9938821',
    });

    assert.strictEqual(finalPay.invoice.status, 'paid');
    assert.strictEqual(finalPay.invoice.balanceDuePaise, 0);
  });
});
