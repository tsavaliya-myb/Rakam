import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TENANT_REQUEST_KEY } from '../constants';
import { TenantContext } from '../interfaces/tenant-context.interface';

export const Tenant = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): TenantContext =>
    ctx.switchToHttp().getRequest()[TENANT_REQUEST_KEY],
);
