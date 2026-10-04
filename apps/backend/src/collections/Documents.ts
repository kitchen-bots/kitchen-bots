import type { CollectionConfig } from 'payload';

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    group: 'Content & Media',
    useAsTitle: 'title',
    defaultColumns: ['title', 'documentType', 'product', 'isPublic', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return { isPublic: { equals: true } };
      return true;
    },
    create: ({ req: { user } }) => Boolean(user && ['admin', 'operations', 'editor'].includes(user.role as string)),
    update: ({ req: { user } }) => Boolean(user && ['admin', 'operations', 'editor'].includes(user.role as string)),
    delete: ({ req: { user } }) => Boolean(user && ['admin', 'operations', 'editor'].includes(user.role as string)),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'documentType',
      type: 'select',
      defaultValue: 'spec_sheet',
      required: true,
      options: [
        { label: 'Specification Sheet', value: 'spec_sheet' },
        { label: 'User Manual', value: 'manual' },
        { label: 'Warranty Document', value: 'warranty' },
        { label: 'Compliance Certificate', value: 'compliance' },
        { label: 'Invoice / Receipt', value: 'invoice' },
      ],
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'externalUrl',
      type: 'text',
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
};
