import React from 'react';
import { KITCHENBOTS_LOGO_WHITE_DATA_URL } from './brandAssets';

interface AdminDashboardProps {
  payload?: Record<string, unknown>;
  user?: Record<string, unknown>;
  [key: string]: unknown;
}

export function AdminDashboard(_props?: AdminDashboardProps) {
  const kpis = [
    {
      title: 'Commercial Revenue',
      value: '₹18,45,000',
      trend: '+14.2% MoM',
      isPositive: true,
      sub: 'Fiscal Year 2026 YTD',
      badge: 'Commercial',
      link: '/admin/collections/orders',
    },
    {
      title: 'Active Orders',
      value: '04',
      trend: '+2 this week',
      isPositive: true,
      sub: '2 In Fabrication · 2 Dispatched',
      badge: 'Fulfillment',
      link: '/admin/collections/orders',
    },
    {
      title: 'Equipment Fleet',
      value: '12',
      trend: '6 Series Active',
      isPositive: true,
      sub: 'All Authentic CAD Models',
      badge: 'Catalog',
      link: '/admin/collections/products',
    },
    {
      title: 'B2B Quotations',
      value: '07',
      trend: '3 Under Review',
      isPositive: true,
      sub: '₹24.8L Pending Pipeline',
      badge: 'B2B Sales',
      link: '/admin/collections/quotes',
    },
    {
      title: 'Commercial Leads',
      value: '19',
      trend: '+5 New Today',
      isPositive: true,
      sub: 'Inquiries via Storefront Desk',
      badge: 'CRM Leads',
      link: '/admin/collections/enquiries',
    },
    {
      title: 'Service & Warranty',
      value: '02',
      trend: '100% SLA Normal',
      isPositive: true,
      sub: 'Preventative Maintenance',
      badge: 'Support',
      link: '/admin/collections/services',
    },
  ];

  // Monthly revenue data points for SVG chart (APR through MAR)
  const revenuePoints = [
    { month: 'APR', val: 1.2, label: '₹1.2L' },
    { month: 'MAY', val: 1.6, label: '₹1.6L' },
    { month: 'JUN', val: 2.1, label: '₹2.1L' },
    { month: 'JUL', val: 2.8, label: '₹2.8L' },
    { month: 'AUG', val: 2.4, label: '₹2.4L' },
    { month: 'SEP', val: 3.5, label: '₹3.5L' },
    { month: 'OCT', val: 3.9, label: '₹3.9L' },
    { month: 'NOV', val: 4.6, label: '₹4.6L' },
    { month: 'DEC', val: 5.2, label: '₹5.2L' },
    { month: 'JAN', val: 4.8, label: '₹4.8L' },
    { month: 'FEB', val: 5.4, label: '₹5.4L' },
    { month: 'MAR', val: 6.2, label: '₹6.2L' },
  ];

  // SVG Chart Geometry
  const chartWidth = 720;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const maxVal = 7.0;
  const innerW = chartWidth - paddingX * 2;
  const innerH = chartHeight - paddingY * 2;

  const points = revenuePoints.map((p, i) => {
    const x = paddingX + (i / (revenuePoints.length - 1)) * innerW;
    const y = chartHeight - paddingY - (p.val / maxVal) * innerH;
    return { x, y, ...p };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(chartHeight - paddingY).toFixed(1)} L ${points[0].x.toFixed(1)} ${(chartHeight - paddingY).toFixed(1)} Z`;

  // Sample recent commercial orders
  const recentOrders = [
    {
      id: 'KB-ORD-9421',
      customer: 'Barbeque Nation Hospitality',
      items: '2x Santa Maria 72" Heavy Duty',
      amount: '₹4,65,000',
      status: 'Manufacturing',
      statusColor: '#f59e0b',
    },
    {
      id: 'KB-ORD-9388',
      customer: 'Taj Gateway Outdoor Kitchens',
      items: '1x Automated Charcoal BBQ SS-304',
      amount: '₹2,85,000',
      status: 'Processing',
      statusColor: '#3b82f6',
    },
    {
      id: 'KB-ORD-9352',
      customer: 'Pitmaster Pro Catering Co',
      items: '4x Rocket Stove RS-4 High-Output',
      amount: '₹1,24,000',
      status: 'Dispatched',
      statusColor: '#22c55e',
    },
    {
      id: 'KB-ORD-9310',
      customer: 'Hyderabad Smokehouse Hub',
      items: '1x Commercial Custom Rotisserie',
      amount: '₹1,95,000',
      status: 'Confirmed',
      statusColor: '#a855f7',
    },
  ];

  // Sample commercial leads
  const recentLeads = [
    {
      contact: 'Vikram Reddy',
      company: 'Smoke & Fire Grills Group',
      interest: 'Santa Maria Heavy Duty (Commercial)',
      status: 'Proposal Sent',
      statusColor: '#3b82f6',
    },
    {
      contact: 'Ananya Sharma',
      company: 'CloudKitchens India Network',
      interest: '6x Rocket Stoves Batch Order',
      status: 'New Lead',
      statusColor: '#22c55e',
    },
    {
      contact: 'Rajesh Verma',
      company: 'Highway Dhaba Enterprise',
      interest: 'Automated Skewer BBQ Machine',
      status: 'Requirement Gathering',
      statusColor: '#f59e0b',
    },
    {
      contact: 'Capt. Sunil Nair',
      company: 'Southern Resort & Retreat',
      interest: 'Bespoke Santa Maria + Parilla Combo',
      status: 'Site Visit Scheduled',
      statusColor: '#a855f7',
    },
  ];

  // Audit activity events
  const auditLogs = [
    { time: 'Just now', actor: 'System', text: 'Supabase PostgreSQL schema synchronized (21 tables active)' },
    { time: '15m ago', actor: 'admin@kitchenbots.com', text: 'Seeded 12 authentic CAD models and 6 categories' },
    { time: '1h ago', actor: 'System', text: 'Cloudflare R2 storage credentials authenticated' },
    { time: 'Yesterday', actor: 'System', text: 'Single-domain proxy router mounted (/admin -> :3001)' },
  ];

  return (
    <div style={{ marginBottom: '40px' }}>
      {/* ── Top Operations Banner with Authentic Logo ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          padding: '20px 24px',
          backgroundColor: '#121215',
          borderRadius: '12px',
          border: '1px solid #27272a',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <img
            src={KITCHENBOTS_LOGO_WHITE_DATA_URL}
            alt="KitchenBots India Pvt. Ltd."
            style={{
              height: '42px',
              width: 'auto',
              maxWidth: '220px',
              objectFit: 'contain',
              display: 'block',
              flexShrink: 0,
            }}
          />
          <div style={{ height: '36px', width: '1px', backgroundColor: '#27272a', flexShrink: 0 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#fafafa',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Operations & Equipment Command Desk
              </h1>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#22c55e',
                  }}
                >
                  Supabase Active
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#71717a' }}>
              Real-time commercial automation, orders, machinery catalog, and B2B quotations.
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            <span>+ Add Equipment</span>
          </a>
          <a
            href="/admin/collections/orders/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#18181b',
              color: '#e4e4e7',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              border: '1px solid #27272a',
            }}
          >
            <span>+ New Order</span>
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
              backgroundColor: '#18181b',
              color: '#e4e4e7',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              border: '1px solid #27272a',
            }}
          >
            <span>Storefront ↗</span>
          </a>
        </div>
      </div>

      {/* ── 6 KPI Metric Cards Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {kpis.map((kpi, idx) => (
          <a
            key={idx}
            href={kpi.link}
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '10px',
              padding: '16px 18px',
              textDecoration: 'none',
              display: 'block',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>{kpi.title}</span>
              <span
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#1c1917',
                  color: '#f97316',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                }}
              >
                {kpi.badge}
              </span>
            </div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#fafafa',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                marginBottom: '4px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {kpi.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <span
                style={{
                  color: kpi.isPositive ? '#22c55e' : '#ef4444',
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {kpi.trend}
              </span>
              <span style={{ color: '#52525b' }}>·</span>
              <span style={{ color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {kpi.sub}
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* ── Revenue Performance Chart (Pure High-Precision SVG) ── */}
      <div
        style={{
          backgroundColor: '#121215',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>
              Commercial Revenue Trajectory
            </div>
            <div style={{ fontSize: '12px', color: '#71717a' }}>
              Monthly billing performance across Santa Maria & Rocket Stove fleet orders
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                fontSize: '11px',
                color: '#a1a1aa',
                backgroundColor: '#18181b',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #27272a',
              }}
            >
              FY 2025–2026
            </span>
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                fontSize: '11px',
                color: '#22c55e',
                fontWeight: 600,
              }}
            >
              ● Actuals + Trajectory
            </span>
          </div>
        </div>

        {/* SVG Responsive Line Chart */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: '100%', height: 'auto', maxHeight: '180px', display: 'block' }}
          >
            <defs>
              <linearGradient id="kbRevenueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {[0, 2, 4, 6].map((tick) => {
              const y = chartHeight - paddingY - (tick / maxVal) * innerH;
              return (
                <g key={tick}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#27272a"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#71717a"
                    fontSize="10"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                  >
                    ₹{tick}L
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            <path d={areaD} fill="url(#kbRevenueGrad)" />

            {/* Main Trajectory Line */}
            <path d={pathD} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />

            {/* Data Point Dots & Labels */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="3.5" fill="#121215" stroke="#f97316" strokeWidth="2" />
                {idx % 2 === 0 && (
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    fill="#a1a1aa"
                    fontSize="9"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                  >
                    {p.label}
                  </text>
                )}
                <text
                  x={p.x}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  fill="#71717a"
                  fontSize="10"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                  {p.month}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* ── Two-Column Operations Layout: Left Data Tables, Right Panels ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Left Column: Recent Orders & Leads */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Recent Orders Table */}
          <div
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>Recent Orders</span>
                <span style={{ fontSize: '12px', color: '#71717a', marginLeft: '8px' }}>Fulfillment Queue</span>
              </div>
              <a
                href="/admin/collections/orders"
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#f97316',
                  textDecoration: 'none',
                }}
              >
                View all orders →
              </a>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272a', color: '#71717a' }}>
                    <th style={{ padding: '8px 10px', fontWeight: 600 }}>Order Number</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600 }}>Total Paise</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #1c1917',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 10px',
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          color: '#f97316',
                          fontWeight: 600,
                        }}
                      >
                        {ord.id}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#e4e4e7' }}>
                        <div>{ord.customer}</div>
                        <div style={{ fontSize: '10px', color: '#71717a' }}>{ord.items}</div>
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          color: '#fafafa',
                          fontWeight: 600,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        }}
                      >
                        {ord.amount}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#18181b',
                            color: ord.statusColor,
                            border: `1px solid ${ord.statusColor}40`,
                          }}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Leads Table */}
          <div
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>Commercial Leads</span>
                <span style={{ fontSize: '12px', color: '#71717a', marginLeft: '8px' }}>CRM Pipeline</span>
              </div>
              <a
                href="/admin/collections/enquiries"
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#f97316',
                  textDecoration: 'none',
                }}
              >
                View all leads →
              </a>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272a', color: '#71717a' }}>
                    <th style={{ padding: '8px 10px', fontWeight: 600 }}>Contact</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600 }}>Interest</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #1c1917' }}>
                      <td style={{ padding: '10px 10px', color: '#e4e4e7' }}>
                        <div style={{ fontWeight: 500 }}>{lead.contact}</div>
                        <div style={{ fontSize: '10px', color: '#71717a' }}>{lead.company}</div>
                      </td>
                      <td style={{ padding: '10px 10px', color: '#a1a1aa' }}>
                        {lead.interest}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#18181b',
                            color: lead.statusColor,
                            border: `1px solid ${lead.statusColor}40`,
                          }}
                        >
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Operations, Hardware Telemetry & Audit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Actions Panel */}
          <div
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>
              Quick Operational Actions
            </div>
            <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '14px' }}>
              Rapid entity creation and catalog dispatch
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <a
                href="/admin/collections/products/create"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  color: '#e4e4e7',
                  fontSize: '12px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <span style={{ color: '#f97316' }}>+</span> Add Product
              </a>
              <a
                href="/admin/collections/quotes/create"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  color: '#e4e4e7',
                  fontSize: '12px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <span style={{ color: '#f97316' }}>+</span> Create Quote
              </a>
              <a
                href="/admin/collections/enquiries/create"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  color: '#e4e4e7',
                  fontSize: '12px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <span style={{ color: '#f97316' }}>+</span> Log Enquiry
              </a>
              <a
                href="/admin/collections/services/create"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  color: '#e4e4e7',
                  fontSize: '12px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <span style={{ color: '#f97316' }}>+</span> Service Ticket
              </a>
              <a
                href="/admin/collections/media"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  color: '#e4e4e7',
                  fontSize: '12px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                📁 Media Bucket
              </a>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  color: '#f97316',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                🌐 Storefront ↗
              </a>
            </div>
          </div>

          {/* Hardware & Cloud Infrastructure Telemetry */}
          <div
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>
              System & Telemetry Status
            </div>
            <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '14px' }}>
              Cloud backend and physical media integrity
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a1a1aa' }}>Database Pooler</span>
                <span style={{ color: '#22c55e', fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>
                  Supabase AP-SE-1 (Active)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a1a1aa' }}>Object Storage</span>
                <span style={{ color: '#22c55e', fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>
                  Cloudflare R2 (Connected)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a1a1aa' }}>Edge Routing</span>
                <span style={{ color: '#22c55e', fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>
                  Single-Domain Proxy (Live)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a1a1aa' }}>Catalog Records</span>
                <span style={{ color: '#f97316', fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>
                  12 Models · 6 Categories
                </span>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>
              Audit Events
            </div>
            <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '14px' }}>
              Recent administrative and system activity
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {auditLogs.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                  <span
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '10px',
                      color: '#71717a',
                      whiteSpace: 'nowrap',
                      minWidth: '55px',
                    }}
                  >
                    {log.time}
                  </span>
                  <div style={{ color: '#a1a1aa' }}>
                    <span style={{ color: '#fafafa', fontWeight: 500 }}>{log.actor}:</span> {log.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
