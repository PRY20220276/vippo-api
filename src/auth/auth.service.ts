import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignInEmailDto } from './dtos/sign-in-email.dto';
import * as argon2 from 'argon2';

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
}
