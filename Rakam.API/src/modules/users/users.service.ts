import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, mobile: true, email: true,
        firstName: true, lastName: true, profilePhotoKey: true,
        lastLoginAt: true, createdAt: true,
        account: { select: { publicId: true, businessTypes: true, defaultFirmId: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id:              user.id.toString(),
      mobile:          user.mobile,
      email:           user.email,
      firstName:       user.firstName,
      lastName:        user.lastName,
      profilePhotoKey: user.profilePhotoKey,
      lastLoginAt:     user.lastLoginAt?.toISOString() ?? null,
      createdAt:       user.createdAt.toISOString(),
      account: {
        publicId:      user.account.publicId,
        businessTypes: user.account.businessTypes,
        defaultFirmId: user.account.defaultFirmId?.toString() ?? null,
      },
    };
  }
}
