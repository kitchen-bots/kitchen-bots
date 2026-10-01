import type { CollectionConfig } from 'payload';

export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  admin: {
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'name', 'email', 'company', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user && ['admin', 'operations', 'editor'].includes(user.role as string)),
    create: () => true, // Public enquiry submission
    update: ({ req: { user } }) => Boolean(user && ['admin', 'operations'].includes(user.role as string)),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
  },
  fields: [
    {
      name: 'reference',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'city',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'productId',
          type: 'text',
        },
        {
          name: 'quantity',
          type: 'number',
          defaultValue: 1,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      required: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ],
};
