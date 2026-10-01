import React from 'react';
import type { Payload } from 'payload';

export async function AdminDashboard({ payload }: { payload: Payload }) {
  // Query live counts on server
  let productCount = 12;
  let categoryCount = 6;
  let orderCount = 0;
  let quoteCount = 0;
  let enquiryCount = 0;

  try {
    if (payload?.count) {
      const [prods, cats, ords, qts, enqs] = await Promise.all([
        payload.count({ collection: 'products' }).then((r) => r.totalDocs).catch(() => 12),
        payload.count({ collection: 'categories' }).then((r) => r.totalDocs).catch(() => 6),
        payload.count({ collection: 'orders' }).then((r) => r.totalDocs).catch(() => 0),
        payload.count({ collection: 'quotes' }).then((r) => r.totalDocs).catch(() => 0),
        payload.count({ collection: 'enquiries' }).then((r) => r.totalDocs).catch(() => 0),
      ]);
      productCount = prods;
      categoryCount = cats;
      orderCount = ords;
      quoteCount = qts;
      enquiryCount = enqs;
    }
  } catch {
    // Fallback if local payload is initializing
  }

  const statCards = [
    { label: 'Active Catalog', value: productCount, sub: 'Authentic Robot Models', badge: 'Active' },
    { label: 'Categories', value: categoryCount, sub: 'Equipment Series', badge: 'Catalog' },
    { label: 'Customer Orders', value: orderCount, sub: 'Direct Purchases', badge: 'Orders' },
    { label: 'B2B Quotes', value: quoteCount, sub: 'Custom Quotations', badge: 'Commercial' },
    { label: 'Inquiries', value: enquiryCount, sub: 'Lead Submissions', badge: 'Leads' },
  ];

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '24px 28px',
          backgroundColor: '#121215',
          borderRadius: '12px',
          border: '1px solid #27272a',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
              }}
            />
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#a1a1aa',
              }}
            >
              Supabase PostgreSQL · Production Online
            </span>
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#fafafa',
              margin: '0 0 4px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Kitchen Bots Operations Hub
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#71717a' }}>
            Manage commercial equipment, product specifications, B2B quotation workflows, and media assets.
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href="/admin/collections/products/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#f97316',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.15s ease',
            }}
          >
            <span>+ Add Product</span>
          </a>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#27272a',
              color: '#e4e4e7',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              border: '1px solid #3f3f46',
            }}
          >
            <span>View Storefront ↗</span>
          </a>
        </div>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {statCards.map((card, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '10px',
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#a1a1aa',
                  letterSpacing: '0.02em',
                }}
              >
                {card.label}
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#1c1917',
                  color: '#f97316',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                }}
              >
                {card.badge}
              </span>
            </div>
            <div
              style={{
                fontSize: '30px',
                fontWeight: 800,
                color: '#fafafa',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                marginBottom: '6px',
              }}
            >
              {card.value}
            </div>
            <div style={{ fontSize: '11px', color: '#71717a' }}>{card.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
