import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  AuthStartDto,
  AuthVerifyDto,
  AuthResponseDto,
  RegisterDto,
  LoginDto,
} from './dto/auth.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  /**
   * Start authentication by sending OTP to email
   */
  async startAuth(dto: AuthStartDto): Promise<{ message: string }> {
    const { email } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email: normalizedEmail },
      });
    }

    // Invalidate any existing unused OTP codes for this user
    await this.prisma.otpCode.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: { used: true },
    });

    // Generate 6-digit OTP
    const otp = this.generateOtp();

    // Store OTP with 10-minute expiration
    await this.prisma.otpCode.create({
      data: {
        code: otp,
        userId: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send OTP email
    const emailSent = await this.emailService.sendOtpEmail(normalizedEmail, otp);

    if (!emailSent) {
      this.logger.error(`Failed to send OTP email to ${normalizedEmail}`);
      // Don't expose email failure to user for security reasons
      // The OTP is still valid if they check logs in dev mode
    }

    return { message: 'OTP sent to your email' };
  }

  /**
   * Verify OTP and return tokens
   */
  async verifyOtp(dto: AuthVerifyDto): Promise<AuthResponseDto> {
    const { email, otp } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user with onboarding profile
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        onboardingProfile: {
          select: { completedAt: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or OTP');
    }

    // Use transaction to atomically find and mark OTP as used
    // This prevents race conditions where two concurrent requests use the same OTP
    const otpRecord = await this.prisma.$transaction(async (tx) => {
      // Find valid OTP
      const found = await tx.otpCode.findFirst({
        where: {
          userId: user.id,
          code: otp,
          used: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!found) {
        return null;
      }

      // Atomically mark OTP as used and return the updated record
      // If another transaction already marked it, this will fail
      const updated = await tx.otpCode.updateMany({
        where: {
          id: found.id,
          used: false, // Double-check it's still unused
        },
        data: { used: true },
      });

      // If no rows were updated, another request beat us to it
      if (updated.count === 0) {
        return null;
      }

      return found;
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        hasCompletedOnboarding: !!user.onboardingProfile?.completedAt,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Check if refresh token exists and is valid
      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: payload.sub,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: { onboardingProfile: true }
          }
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });

      // Generate new tokens
      const tokens = await this.generateTokens(storedToken.userId);

      return {
        ...tokens,
        user: {
          id: storedToken.user.id,
          email: storedToken.user.email,
          createdAt: storedToken.user.createdAt,
          hasCompletedOnboarding: !!storedToken.user.onboardingProfile,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Revoke specific refresh token
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          token: refreshToken,
        },
        data: { revoked: true },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Add jti (JWT ID) for uniqueness to prevent token collisions
    const jti = crypto.randomUUID();
    const payload = { sub: userId, jti };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Register a new user with email and password
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name || null,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        hasCompletedOnboarding: false, // New users never have completed onboarding
      },
    };
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user with onboarding profile
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        onboardingProfile: {
          select: { completedAt: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user has a password (might be OTP-only user)
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses email verification. Please use the OTP login method.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed for ${normalizedEmail}: password length=${password.length}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        hasCompletedOnboarding: !!user.onboardingProfile?.completedAt,
      },
    };
  }
}
