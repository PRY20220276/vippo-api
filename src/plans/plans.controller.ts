import { Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlansService } from './plans.service';

@ApiBearerAuth()
@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post('payment-sessions')
  createPaymentSession() {
    return this.plansService.createPaymentSession();
  }
}
