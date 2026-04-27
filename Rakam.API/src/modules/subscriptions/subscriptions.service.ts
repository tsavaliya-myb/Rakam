import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CacheTTL, SettingsKeys } from '../../common/cache-keys';

export interface SubscriptionResponse {
  planName: string;
  planType: string;
  expiresOn: string;
  remainingDays: number;
  firmLimit: number;
  firmsUsed: number;
  isActive: boolean;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getSubscription(accountId: bigint): Promise<SubscriptionResponse> {
    const cacheKey = SettingsKeys.subscription(accountId);
    const cached = await this.redis.get<SubscriptionResponse>(cacheKey);
    if (cached) return cached;

    const [sub, firmsUsed] = await Promise.all([
      this.prisma.subscription.findUnique({ where: { accountId } }),
      this.prisma.firm.count({ where: { accountId, deletedAt: null } }),
    ]);

    if (!sub) throw new NotFoundException('Subscription not found');

    const now = new Date();
    const remainingMs = sub.expiresAt.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

    const response: SubscriptionResponse = {
      planName: sub.planName,
      planType: sub.planType.toLowerCase(),
      expiresOn: sub.expiresAt.toISOString().split('T')[0],
      remainingDays,
      firmLimit: sub.firmLimit,
      firmsUsed,
      isActive: sub.isActive,
    };

    await this.redis.set(cacheKey, response, CacheTTL.SUBSCRIPTION);
    return response;
  }

  async getFirmLimit(accountId: bigint): Promise<number> {
    const cacheKey = SettingsKeys.subscription(accountId);
    const cached = await this.redis.get<SubscriptionResponse>(cacheKey);
    if (cached) return cached.firmLimit;

    const sub = await this.prisma.subscription.findUnique({
      where: { accountId },
      select: { firmLimit: true },
    });

    return sub?.firmLimit ?? 1;
  }

  async invalidateCache(accountId: bigint): Promise<void> {
    await this.redis.del(SettingsKeys.subscription(accountId));
  }
}
