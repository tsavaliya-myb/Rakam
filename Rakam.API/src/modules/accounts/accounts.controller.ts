import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/tenant-context.interface';
import { AccountsService } from './accounts.service';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current account',
    description:
      'Returns the authenticated user\'s account with all non-deleted firms, ' +
      'default firm ID, and business types.',
  })
  @ApiResponse({
    status: 200,
    description: '{ id, publicId, businessTypes, defaultFirmId, createdAt, firms[] }',
  })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.accounts.getMe(user.accountId);
  }
}
