import type { CollectionConfig } from 'payload';

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  admin: {
    group: 'Sales & Support',
    useAsTitle: 'quoteNumber',
    defaultColumns: ['quoteNumber', 'companyName', 'contactName', 'status', 'estimatedPaise', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (['admin', 'operations', 'editor'].includes(user.role as string)) return true;
      return {
        contactEmail: {
          equals: user.email,
        },
      };
    },
    create: () => true, // Allows customer quote requests
    update: ({ req: { user } }) => Boolean(user && ['admin', 'operations'].includes(user.role as string)),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;
        const record = data as Record<string, unknown>;
        if (!record.quoteNumber) {
          record.quoteNumber = record.Quotation || record.quotation || record.orderNumber || record['Order Number'] || `KB-QT-${Date.now().toString(36).toUpperCase()}`;
        }
        if (!record.contactName) {
          record.contactName = record.customerName || record['Customer Name'] || record.contactName || record.name || record.fullName || 'Commercial Customer';
        }
        if (!record.companyName) {
          record.companyName = record.company || record.companyName || record.businessName || record.customerName || record.contactName || 'Commercial Customer';
        }
        if (!record.contactEmail && (record.Email || record.email || record['Customer Email'] || record.customerEmail)) {
          record.contactEmail = record.Email || record.email || record['Customer Email'] || record.customerEmail;
        }
        if (!record.contactPhone && (record['Phone no'] || record['Phone No'] || record['Customer Phone'] || record.phone || record.Phone || record.phoneNo || record.customerPhone)) {
          record.contactPhone = record['Phone no'] || record['Phone No'] || record['Customer Phone'] || record.phone || record.Phone || record.phoneNo || record.customerPhone;
        }
        if (record.estimatedPaise === undefined || record.estimatedPaise === null) {
          const tp = record['Total Price'] ?? record.totalPrice ?? record.totalPaise ?? record['Total Paise'];
          if (tp !== undefined && tp !== null) {
            const num = Number(tp);
            if (!isNaN(num)) {
              record.estimatedPaise = num < 100000 ? Math.round(num * 100) : Math.round(num);
            }
          }
        }
        return record;
      },
    ],
  },
  fields: [
    {
      name: 'quoteNumber',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'companyName',
      type: 'text',
      required: true,
    },
    {
      name: 'contactName',
      type: 'text',
      required: true,
    },
    {
      name: 'contactEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'contactPhone',
      type: 'text',
    },
    {
      name: 'city',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'submitted',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Sent', value: 'sent' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Expired', value: 'expired' },
      ],
    },
    {
      name: 'estimatedPaise',
      type: 'number',
      min: 0,
      admin: {
        description: 'Estimated quotation total in paise',
      },
    },
    {
      name: 'validUntil',
      type: 'date',
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
        },
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'quantity',
          type: 'number',
          defaultValue: 1,
        },
        {
          name: 'customRequirements',
          type: 'textarea',
        },
        {
          name: 'quotedPricePaise',
          type: 'number',
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
};
