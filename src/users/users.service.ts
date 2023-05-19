import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await argon2.hash(createUserDto.password);
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
    return user;
  }

  findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });
  }

  async update(firstName: string, lastName: string, id: number) {
    return this.prisma.user.update({
      where: {
        id: id,
      },
      data: {
        firstName: firstName,
        lastName: lastName,
      },
    });
  }

  async updateUserPassword(userId: number, newPassword: string) {
    const hashedNewPassword = await argon2.hash(newPassword);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }
}
