import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { ExposedEndpoint } from './decorators/exposed-endpoint.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignInEmailDto } from './dto/sign-in-email.dto';

@ApiTags('Auth Module')
@Controller({
  path: 'auth',
  version: '1',
})
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
    summary: 'Change user password',
  })
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @ApiOperation({
    summary: 'Change user password',
  })
  @Get('user')
  async getCurrentUser(@CurrentUser() user: User) {
    return user;
  }
}
