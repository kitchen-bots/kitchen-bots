import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content & Media',
  },
  upload: {
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user && ['admin', 'operations', 'editor'].includes(user.role as string)),
    update: ({ req: { user } }) => Boolean(user && ['admin', 'operations', 'editor'].includes(user.role as string)),
    delete: ({ req: { user } }) => Boolean(user && ['admin', 'operations', 'editor'].includes(user.role as string)),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
};
