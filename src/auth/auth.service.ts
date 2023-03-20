import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignInEmailDto } from './dto/sign-in-email.dto';
import * as argon2 from 'argon2';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * It takes in a user's email and password, checks if the user exists, if the user exists, it checks
   * if the password is valid, if the password is valid, it signs a JWT token with the user's email,
   * role, and id, and returns the token and the user
   * @param {SignInEmailDto} signInEmailDto - SignInEmailDto
   * @returns An object with two properties: authenticatedUser and accessToken.
   */
  async signInWithEmail(signInEmailDto: SignInEmailDto) {
    const user = await this.usersService.findOneByEmail(signInEmailDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isValidPassword = await argon2.verify(
      user.password,
      signInEmailDto.password,
    );
    /*
    if (user.verified === false) {
      throw new UnauthorizedException('Please verify your email');
    }
    */
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user.id,
    });
    return {
      authenticatedUser: user,
      accessToken: accessToken,
    };
  }

  async signUp(signUpDto: SignUpDto) {
    if (signUpDto.email != 'manriqueacham@gmail.com') {
      throw new BadRequestException('Sign up is not allowed');
    }
    return this.usersService.create({
      email: signUpDto.email,
      password: signUpDto.password,
    });
  }

  /**
   * It takes a userId and a changePasswordDto object, finds the user with the given userId, checks if
   * the oldPassword matches the user's password, and if it does, updates the user's password with the
   * newPassword
   * @param {number} userId - The id of the user whose password we want to change.
   * @param {ChangePasswordDto} changePasswordDto - ChangePasswordDto
   * @returns A message saying the password was changed successfully.
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid user id');
    }
    const isValidPassword = await argon2.verify(
      user.password,
      changePasswordDto.oldPassword,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password');
    }
    await this.usersService.updateUserPassword(
      userId,
      changePasswordDto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }
}
