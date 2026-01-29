import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import {
  RegisterDeviceDto,
  UpdateNotificationPreferencesDto,
  NotificationPreferencesResponseDto,
  NotificationLogResponseDto,
  SendTestNotificationDto,
  DeviceTokenResponseDto,
} from './dto/notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ============ Device Token Management ============

  @Post('devices')
  @ApiOperation({ summary: 'Register device for push notifications' })
  @ApiResponse({ status: 201, description: 'Device registered', type: DeviceTokenResponseDto })
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.notificationsService.registerDevice(userId, dto);
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get all registered devices' })
  @ApiResponse({ status: 200, type: [DeviceTokenResponseDto] })
  async getDevices(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUserDevices(userId);
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Unregister a device' })
  @ApiResponse({ status: 200, description: 'Device unregistered' })
  async unregisterDevice(
    @CurrentUser('id') userId: string,
    @Param('token') token: string,
  ) {
    return this.notificationsService.unregisterDevice(userId, token);
  }

  // ============ Preferences ============

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponseDto })
  async getPreferences(@CurrentUser('id') userId: string) {
    return this.notificationsService.getPreferences(userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponseDto })
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(userId, dto);
  }

  // ============ Notification History ============

  @Get('history')
  @ApiOperation({ summary: 'Get notification history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [NotificationLogResponseDto] })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.getNotificationHistory(userId, limit || 50);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, type: NotificationLogResponseDto })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  // ============ Test ============

  @Post('test')
  @ApiOperation({ summary: 'Send a test notification to yourself' })
  @ApiResponse({ status: 200, description: 'Test notification sent' })
  async sendTestNotification(
    @CurrentUser('id') userId: string,
    @Body() dto: SendTestNotificationDto,
  ) {
    return this.notificationsService.sendTestNotification(userId, dto.title, dto.body);
  }
}
