import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';
import { TENANT_REQUEST_KEY } from '../constants';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const firmId = req.headers['x-firm-id'];
    const fy = req.headers['x-fy'];
    if (!firmId || !fy) throw new BadRequestException('Missing x-firm-id or x-fy header');
    req[TENANT_REQUEST_KEY] = {
      accountId: req.user?.accountId,
      firmId: BigInt(firmId),
      fy: parseInt(fy, 10),
    };
    return true;
  }
}
