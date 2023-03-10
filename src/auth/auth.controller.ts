import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ExposedEndpoint } from './decorators/exposed-endpoint.decorator';
import { SignInEmailDto } from './dtos/sign-in-email.dto';

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
}
