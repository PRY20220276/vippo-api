import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { ExposedEndpoint } from './decorators/exposed-endpoint.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignInEmailDto } from './dto/sign-in-email.dto';
import { SignUpDto } from './dto/sign-up.dto';

@ApiTags('Auth Module')
@Controller({
  path: 'auth',
  version: '1',
})
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Authenticate using your email & password',
  })
  @Post('login-email')
  @ExposedEndpoint()
  async loginEmail(@Body() signInEmailDto: SignInEmailDto) {
    return this.authService.signInWithEmail(signInEmailDto);
  }

  @ApiOperation({
    summary: 'Create a new account',
  })
  @Post('register')
  @ExposedEndpoint()
  async register(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change user password',
  })
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change user password',
  })
  @Get('user')
  async getCurrentUser(@CurrentUser() user: User) {
    return user;
  }
}
