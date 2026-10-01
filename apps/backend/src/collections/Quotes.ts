import type { CollectionConfig } from 'payload';

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  admin: {
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
