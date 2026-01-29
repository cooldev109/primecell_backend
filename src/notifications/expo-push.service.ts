import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Expo, { ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';

export interface PushNotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  categoryId?: string;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

export interface PushResult {
  success: boolean;
  ticketId?: string;
  receiptId?: string;
  error?: string;
  token: string;
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private expo: Expo;

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>('EXPO_ACCESS_TOKEN');
    this.expo = new Expo({ accessToken });
  }

  /**
   * Validate if a token is a valid Expo push token
   */
  isValidToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }

  /**
   * Send push notifications to one or more devices
   */
  async sendPushNotifications(
    notifications: PushNotificationPayload[],
  ): Promise<PushResult[]> {
    const messages: ExpoPushMessage[] = [];
    const tokenMap: Map<number, string> = new Map();

    // Build messages and validate tokens
    for (const notification of notifications) {
      const tokens = Array.isArray(notification.to) ? notification.to : [notification.to];

      for (const token of tokens) {
        if (!this.isValidToken(token)) {
          this.logger.warn(`Invalid Expo push token: ${token}`);
          continue;
        }

        tokenMap.set(messages.length, token);
        messages.push({
          to: token,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: notification.sound || 'default',
          badge: notification.badge,
          categoryId: notification.categoryId,
          channelId: notification.channelId || 'default',
          priority: notification.priority || 'high',
          ttl: notification.ttl,
        });
      }
    }

    if (messages.length === 0) {
      this.logger.warn('No valid push tokens to send to');
      return [];
    }

    const results: PushResult[] = [];

    // Chunk messages to avoid exceeding Expo's rate limits
    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);

        for (let i = 0; i < ticketChunk.length; i++) {
          const ticket = ticketChunk[i];
          const token = tokenMap.get(i) || 'unknown';

          if (ticket.status === 'ok') {
            results.push({
              success: true,
              ticketId: ticket.id,
              token,
            });
          } else {
            results.push({
              success: false,
              error: ticket.message,
              token,
            });

            // Log device errors for cleanup
            if (ticket.details?.error === 'DeviceNotRegistered') {
              this.logger.warn(`Device not registered, should remove token: ${token}`);
            }
          }
        }
      } catch (error: any) {
        this.logger.error('Failed to send push notification chunk', error);

        // Mark all in this chunk as failed
        for (let i = 0; i < chunk.length; i++) {
          const token = tokenMap.get(results.length + i) || 'unknown';
          results.push({
            success: false,
            error: error?.message || 'Unknown error',
            token,
          });
        }
      }
    }

    return results;
  }

  /**
   * Send a single push notification
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<PushResult> {
    const results = await this.sendPushNotifications([payload]);
    return results[0] || { success: false, error: 'No result', token: String(payload.to) };
  }

  /**
   * Get push notification receipts to check delivery status
   */
  async getPushReceipts(receiptIds: string[]): Promise<Map<string, ExpoPushReceipt>> {
    const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
    const receipts = new Map<string, ExpoPushReceipt>();

    for (const chunk of receiptIdChunks) {
      try {
        const receiptChunk = await this.expo.getPushNotificationReceiptsAsync(chunk);

        for (const [id, receipt] of Object.entries(receiptChunk)) {
          receipts.set(id, receipt);
        }
      } catch (error) {
        this.logger.error('Failed to get push receipts', error);
      }
    }

    return receipts;
  }
}
