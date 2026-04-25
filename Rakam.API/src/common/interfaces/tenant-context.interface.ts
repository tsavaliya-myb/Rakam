export interface TenantContext {
  accountId: bigint;
  firmId: bigint;
  fy: number;
}

export interface AuthenticatedUser {
  userId: bigint;
  accountId: bigint;
  mobile: string;
}
