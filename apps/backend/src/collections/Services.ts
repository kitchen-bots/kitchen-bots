import type { CollectionConfig } from 'payload';

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    group: 'Sales & Support',
    useAsTitle: 'ticketNumber',
    defaultColumns: ['ticketNumber', 'companyName', 'equipmentName', 'priority', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => true,
    update: ({ req: { user } }) => Boolean(user && ['admin', 'operations'].includes(user.role as string)),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
  },
  fields: [
    {
      name: 'ticketNumber',
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
      name: 'contactPhone',
      type: 'text',
      required: true,
    },
    {
      name: 'equipmentName',
      type: 'text',
      required: true,
    },
    {
      name: 'serialNumber',
      type: 'text',
    },
    {
      name: 'issueDescription',
      type: 'textarea',
      required: true,
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'medium',
      required: true,
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      required: true,
      options: [
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Waiting for Parts', value: 'waiting_parts' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    {
      name: 'resolutionNotes',
      type: 'textarea',
    },
  ],
};
