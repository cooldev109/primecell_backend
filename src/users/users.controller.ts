import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { UserWithOnboardingDto } from './dto/user.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get the authenticated user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserWithOnboardingDto,
  })
  async getMe(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserWithOnboardingDto> {
    return this.usersService.findById(user.id);
  }
}
