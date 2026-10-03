import type { CollectionConfig } from 'payload';

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    group: 'Commerce',
    useAsTitle: 'name',
    defaultColumns: ['name', 'sku', 'category', 'pricePaise', 'status', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user && ['admin', 'operations', 'editor'].includes(user.role as string)),
    update: ({ req: { user } }) => Boolean(user && ['admin', 'operations', 'editor'].includes(user.role as string)),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'pricePaise',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Price in paise (e.g. 1800000 = ₹18,000)',
      },
    },
    {
      name: 'salesMode',
      type: 'select',
      defaultValue: 'both',
      required: true,
      options: [
        { label: 'Direct Purchase Only', value: 'direct' },
        { label: 'B2B Quotation Only', value: 'quote' },
        { label: 'Both Direct & Quotation', value: 'both' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'Active',
      required: true,
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Draft', value: 'Draft' },
        { label: 'Archived', value: 'Archived' },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'shortDescription',
      type: 'textarea',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'primaryImage',
      type: 'text',
      admin: {
        description: 'CDN URL or asset path for primary product image',
      },
    },
    {
      name: 'imageUrls',
      type: 'array',
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'features',
      type: 'array',
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'specifications',
      type: 'json',
      admin: {
        description: 'Technical specs object: key-value pairs (e.g. Dimensions, Power, Material)',
      },
    },
    {
      name: 'sequenceId',
      type: 'text',
      admin: {
        description: 'Turntable 360 viewer sequence ID (e.g. auto-wok-robot-360)',
      },
    },
    {
      name: 'sequenceFrameCount',
      type: 'number',
      defaultValue: 36,
    },
    {
      name: 'has3D',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'hasVideo',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'videoPath',
      type: 'text',
    },
  ],
};
