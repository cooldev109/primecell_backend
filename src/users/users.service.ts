import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        onboardingProfile: {
          select: {
            primaryGoal: true,
            completedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      hasCompletedOnboarding: !!user.onboardingProfile?.completedAt,
      onboardingProfile: user.onboardingProfile,
    };
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    return user;
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
