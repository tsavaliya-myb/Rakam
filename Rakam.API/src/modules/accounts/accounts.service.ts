import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(accountId: bigint) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        publicId: true,
        businessTypes: true,
        defaultFirmId: true,
        createdAt: true,
        firms: {
          where: { deletedAt: null },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
          select: {
            id: true, name: true, gstNo: true,
            state: true, city: true, isDefault: true,
            logoKey: true, showLogo: true, showWatermark: true, showSignature: true,
          },
        },
      },
    });

    if (!account) throw new NotFoundException('Account not found');

    return {
      id:            account.id.toString(),
      publicId:      account.publicId,
      businessTypes: account.businessTypes,
      defaultFirmId: account.defaultFirmId?.toString() ?? null,
      createdAt:     account.createdAt.toISOString(),
      firms:         account.firms.map((f) => ({
        id:            f.id.toString(),
        name:          f.name,
        gstNo:         f.gstNo,
        state:         f.state,
        city:          f.city,
        isDefault:     f.isDefault,
        logoKey:       f.logoKey,
        showLogo:      f.showLogo,
        showWatermark: f.showWatermark,
        showSignature: f.showSignature,
      })),
    };
  }
}
