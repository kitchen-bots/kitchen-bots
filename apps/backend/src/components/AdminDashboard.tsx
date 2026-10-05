'use client';
import React, { useEffect, useState } from 'react';
import { KITCHENBOTS_LOGO_WHITE_DATA_URL } from './brandAssets';

interface AdminDashboardProps {
  payload?: Record<string, unknown>;
  user?: Record<string, unknown>;
  [key: string]: unknown;
}


export function AdminDashboard(_props?: AdminDashboardProps) {
  const [dashboardData, setDashboardData] = useState({
    revenue: null as number | null,
    activeOrders: null as number | null,
    activeProducts: null as number | null,
    quotations: null as number | null,
    leads: null as number | null,
    serviceTickets: null as number | null,
    categoryCount: null as number | null,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(
    Array(12).fill(0),
  );

  const [recentOrders, setRecentOrders] = useState<
    Array<{
      id: string;
      customer: string;
      items: string;
      amount: string;
      status: string;
      statusColor: string;
    }>
  >([]);

  const [recentLeads, setRecentLeads] = useState<
    Array<{
      contact: string;
      company: string;
      interest: string;
      status: string;
      statusColor: string;
    }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async (
      collection: string,
      where?: string,
    ): Promise<number> => {
      const query = where
        ? `?limit=1&${where}`
        : '?limit=1';

      const response = await fetch(`/api/${collection}${query}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${collection}`);
      }

      const data = await response.json();
      return Number(data.totalDocs ?? 0);
    };

    const loadDashboardData = async () => {
      try {
        const [
          activeProducts,
          pendingOrders,
          processingOrders,
          shippedOrders,
          quotations,
          leads,
          openServices,
          inProgressServices,
          waitingPartsServices,
          categoriesResponse,
          ordersResponse,
          enquiriesResponse,
        ] = await Promise.all([
          fetchCount('products', 'where[status][equals]=Active'),
          fetchCount('orders', 'where[status][equals]=pending'),
          fetchCount('orders', 'where[status][equals]=processing'),
          fetchCount('orders', 'where[status][equals]=shipped'),
          fetchCount('quotes'),
          fetchCount('enquiries'),
          fetchCount('services', 'where[status][equals]=open'),
          fetchCount('services', 'where[status][equals]=in_progress'),
          fetchCount('services', 'where[status][equals]=waiting_parts'),

          fetch('/api/categories?limit=1', {
            credentials: 'include',
          }),

          fetch('/api/orders?limit=1000&sort=-createdAt', {
            credentials: 'include',
          }),

          fetch('/api/enquiries?limit=4&sort=-createdAt', {
            credentials: 'include',
          }),
        ]);

        if (
          !categoriesResponse.ok ||
          !ordersResponse.ok ||
          !enquiriesResponse.ok
        ) {
          throw new Error('Failed to load dashboard records');
        }

        const categoriesData = await categoriesResponse.json();
        const ordersData = await ordersResponse.json();
        const enquiriesData = await enquiriesResponse.json();

        const orders = ordersData.docs ?? [];
        const enquiries = enquiriesData.docs ?? [];

        const revenuePaise = orders
          .filter(
            (order: { status?: string }) => order.status !== 'cancelled',
          )
          .reduce(
            (total: number, order: { totalPaise?: number }) =>
              total + Number(order.totalPaise ?? 0),
            0,
          );

        const fiscalYearStart =
          new Date().getMonth() >= 3
            ? new Date().getFullYear()
            : new Date().getFullYear() - 1;

        const fiscalYearStartDate = new Date(
          fiscalYearStart,
          3,
          1,
        );

        const fiscalYearEndDate = new Date(
          fiscalYearStart + 1,
          3,
          1,
        );

        const monthlyRevenuePaise = Array(12).fill(0);

        orders.forEach(
          (order: {
            createdAt?: string;
            status?: string;
            totalPaise?: number;
          }) => {
            if (
              order.status === 'cancelled' ||
              !order.createdAt
            ) {
              return;
            }

            const createdAt = new Date(order.createdAt);

            if (
              createdAt < fiscalYearStartDate ||
              createdAt >= fiscalYearEndDate
            ) {
              return;
            }

            const monthIndex = (createdAt.getMonth() - 3 + 12) % 12;

            monthlyRevenuePaise[monthIndex] += Number(
              order.totalPaise ?? 0,
            );
          },
        );

        if (!cancelled) {
          setMonthlyRevenue(
            monthlyRevenuePaise.map(
              (value) => value / 100000,
            ),
          );
        }

        const formatOrderAmount = (paise: number) =>
          `₹${(paise / 100).toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`;

        const getOrderStatusColor = (status: string) => {
          switch (status) {
            case 'delivered':
              return '#22c55e';
            case 'shipped':
              return '#22c55e';
            case 'processing':
              return '#3b82f6';
            case 'pending':
              return '#f59e0b';
            case 'cancelled':
              return '#ef4444';
            default:
              return '#a855f7';
          }
        };

        const getOrderStatusLabel = (status: string) =>
          status
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char: string) => char.toUpperCase());

        const formattedOrders = orders
          .slice(0, 4)
          .map(
            (order: {
              orderNumber?: string;
              customerName?: string;
              totalPaise?: number;
              status?: string;
              items?: Array<{
                name?: string;
                quantity?: number;
              }>;
            }) => ({
              id: order.orderNumber ?? '—',
              customer: order.customerName ?? 'Unknown Customer',
              items:
                order.items
                  ?.slice(0, 2)
                  .map(
                    (item) =>
                      `${item.quantity ?? 1}x ${item.name ?? 'Product'}`,
                  )
                  .join(', ') || 'No items',
              amount: formatOrderAmount(Number(order.totalPaise ?? 0)),
              status: getOrderStatusLabel(order.status ?? 'pending'),
              statusColor: getOrderStatusColor(order.status ?? 'pending'),
            }),
          );

        const getLeadStatusColor = (status: string) => {
          switch (status) {
            case 'new':
              return '#22c55e';
            case 'in_progress':
              return '#f59e0b';
            case 'contacted':
              return '#3b82f6';
            case 'resolved':
              return '#22c55e';
            case 'archived':
              return '#71717a';
            default:
              return '#a855f7';
          }
        };

        const getLeadStatusLabel = (status: string) =>
          status
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char: string) => char.toUpperCase());

        const formattedLeads = enquiries.map(
          (enquiry: {
            name?: string;
            company?: string;
            message?: string;
            status?: string;
          }) => ({
            contact: enquiry.name ?? 'Unknown Contact',
            company: enquiry.company ?? 'No Company',
            interest: enquiry.message ?? 'General enquiry',
            status: getLeadStatusLabel(enquiry.status ?? 'new'),
            statusColor: getLeadStatusColor(enquiry.status ?? 'new'),
          }),
        );

        if (!cancelled) {
          setDashboardData({
            revenue: revenuePaise,
            activeOrders:
              pendingOrders + processingOrders + shippedOrders,
            activeProducts,
            quotations,
            leads,
            serviceTickets:
              openServices + inProgressServices + waitingPartsServices,
            categoryCount: Number(categoriesData.totalDocs ?? 0),
          });

          setRecentOrders(formattedOrders);
          setRecentLeads(formattedLeads);
        }
      } catch (error) {
        console.error('Failed to load admin dashboard data:', error);
      }
    };

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatRupees = (paise: number | null) => {
    if (paise === null) return '—';

    return `₹${(paise / 100).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;
  };

  const formatCount = (value: number | null) => {
    if (value === null) return '—';
    return value.toString().padStart(2, '0');
  };

  const kpis = [
    {
      title: 'Commercial Revenue',
      value: formatRupees(dashboardData.revenue),
      trend: 'Live',
      isPositive: true,
      sub: 'Non-cancelled orders',
      badge: 'Commercial',
      link: '/admin/collections/orders',
    },
    {
      title: 'Active Orders',
      value: formatCount(dashboardData.activeOrders),
      trend: 'Live',
      isPositive: true,
      sub: 'Pending · Processing · Shipped',
      badge: 'Fulfillment',
      link: '/admin/collections/orders',
    },
    {
      title: 'Equipment Fleet',
      value: formatCount(dashboardData.activeProducts),
      trend: 'Live',
      isPositive: true,
      sub: 'Active catalog products',
      badge: 'Catalog',
      link: '/admin/collections/products',
    },
    {
      title: 'B2B Quotations',
      value: formatCount(dashboardData.quotations),
      trend: 'Live',
      isPositive: true,
      sub: 'All quotation requests',
      badge: 'B2B Sales',
      link: '/admin/collections/quotes',
    },
    {
      title: 'Commercial Leads',
      value: formatCount(dashboardData.leads),
      trend: 'Live',
      isPositive: true,
      sub: 'All commercial enquiries',
      badge: 'CRM Leads',
      link: '/admin/collections/enquiries',
    },
    {
      title: 'Service & Warranty',
      value: formatCount(dashboardData.serviceTickets),
      trend: 'Live',
      isPositive: true,
      sub: 'Open · In Progress · Waiting Parts',
      badge: 'Support',
      link: '/admin/collections/services',
    },
  ];
  // Monthly revenue data points for SVG chart (APR through MAR)
  const fiscalMonths = [
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
    'JAN',
    'FEB',
    'MAR',
  ];

  const revenuePoints = fiscalMonths.map((month, index) => ({
    month,
    val: monthlyRevenue[index],
    label: `₹${monthlyRevenue[index].toFixed(1)}L`,
  }));

  // SVG Chart Geometry
  const chartWidth = 720;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const maxRevenue = Math.max(...monthlyRevenue, 0);

  const maxVal =
    maxRevenue > 0
      ? Math.ceil(maxRevenue * 1.2)
      : 1;
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
              FY APR–MAR
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
                <span style={{ color: '#a1a1aa' }}>Edge Routing</span>
                <span style={{ color: '#22c55e', fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>
                  Single-Domain Proxy (Live)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a1a1aa' }}>Catalog Records</span>
                <span style={{ color: '#f97316', fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>
                  {dashboardData.activeProducts === null ||
                    dashboardData.categoryCount === null
                    ? '—'
                    : `${dashboardData.activeProducts} Active Models · ${dashboardData.categoryCount} Categories`}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
