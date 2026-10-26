import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    group: 'Administration',
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'name', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin' || user.role === 'operations') return true;
      return {
        id: {
          equals: user.id,
        },
      };
    },
    create: () => true, // Allows customer self-registration
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return {
        id: {
          equals: user.id,
        },
      };
    },
    delete: ({ req: { user } }) => Boolean(user?.role === 'admin'),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'customer',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Operations', value: 'operations' },
        { label: 'HR', value: 'hr' },
        { label: 'Finance', value: 'finance' },
        { label: 'Editor', value: 'editor' },
        { label: 'Employee', value: 'employee' },
        { label: 'Customer', value: 'customer' },
      ],
      access: {
        update: ({ req: { user } }) => Boolean(user?.role === 'admin'),
      },
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'company',
      type: 'text',
    },
  ],
};
