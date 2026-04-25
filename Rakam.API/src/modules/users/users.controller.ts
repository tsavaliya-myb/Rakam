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
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns authenticated user profile with name, mobile, email, profilePhotoKey ' +
      'and nested account metadata (publicId, businessTypes, defaultFirmId). ' +
      'For profile updates use PATCH /settings/profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile + account summary',
  })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.users.getMe(user.userId);
  }
}
