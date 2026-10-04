import type { CollectionConfig } from 'payload';

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    group: 'Commerce',
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerName', 'totalPaise', 'status', 'paymentStatus', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (['admin', 'operations', 'editor'].includes(user.role as string)) return true;
      return {
        customerEmail: {
          equals: user.email,
        },
      };
    },
    create: () => true, // Allows customer and guest checkout
    update: ({ req: { user } }) => Boolean(user && ['admin', 'operations'].includes(user.role as string)),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;
        const record = data as Record<string, unknown>;
        // Standardize Order Number
        if (!record.orderNumber && (record['Order Number'] || record.orderNumber || record.Quotation || record.quotation || record.quoteNumber || record.reference)) {
          record.orderNumber = record['Order Number'] || record.orderNumber || record.Quotation || record.quotation || record.quoteNumber || record.reference;
        }
        // Standardize Customer Name
        if (!record.customerName && (record['Customer Name'] || record.customerName || record.name || record.fullName)) {
          record.customerName = record['Customer Name'] || record.customerName || record.name || record.fullName;
        }
        // Standardize Customer Email
        if (!record.customerEmail && (record['Customer Email'] || record.customerEmail || record.Email || record.email)) {
          record.customerEmail = record['Customer Email'] || record.customerEmail || record.Email || record.email;
        }
        // Standardize Customer Phone
        if (!record.customerPhone && (record['Customer Phone'] || record.customerPhone || record['Phone no'] || record['Phone No'] || record.phone || record.Phone || record.phoneNo)) {
          record.customerPhone = record['Customer Phone'] || record.customerPhone || record['Phone no'] || record['Phone No'] || record.phone || record.Phone || record.phoneNo;
        }
        // Standardize Total Paise
        if (record.totalPaise === undefined || record.totalPaise === null) {
          const tp = record['Total Paise'] ?? record.totalPaise ?? record['Total Price'] ?? record.totalPrice ?? record['Total paise'] ?? record.total;
          if (tp !== undefined && tp !== null) {
            const num = Number(tp);
            if (!isNaN(num)) {
              record.totalPaise = num < 100000 ? Math.round(num * 100) : Math.round(num);
            }
          }
        }
        return record;
      },
    ],
  },
  fields: [
    {
      name: 'orderNumber',
      label: 'Order Number',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'customerName',
      label: 'Customer Name',
      type: 'text',
      required: true,
    },
    {
      name: 'customerEmail',
      label: 'Customer Email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'customerPhone',
      label: 'Customer Phone',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      name: 'totalPaise',
      label: 'Total Paise',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'sku',
          type: 'text',
        },
        {
          name: 'pricePaise',
          type: 'number',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
        },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'group',
      fields: [
        { name: 'fullName', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true },
        { name: 'addressLine1', type: 'text', required: true },
        { name: 'addressLine2', type: 'text' },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text', required: true },
        { name: 'postalCode', type: 'text', required: true },
        { name: 'country', type: 'text', defaultValue: 'India' },
      ],
    },
    {
      name: 'trackingNumber',
      type: 'text',
    },
    {
      name: 'carrier',
      type: 'text',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
};
