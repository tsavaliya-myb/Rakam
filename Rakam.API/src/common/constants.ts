export const TENANT_REQUEST_KEY = 'tenant';
export const CURRENT_USER_KEY = 'user';

export const CACHE_TTL = {
  DASHBOARD: 60,
  PARTY_LIST: 60 * 60 * 24 * 3,
  PRODUCT_LIST: 60 * 5,
  SETTINGS: 60 * 60,
} as const;

export const QUEUES = {
  PDF: 'pdf',
  EXCEL: 'excel',
  EWAY: 'eway',
  NOTIFY: 'notify',
  EMAIL: 'email',
  REPORTS: 'reports',
} as const;
