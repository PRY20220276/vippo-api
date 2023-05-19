import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { StripeService } from '../shared/stripe.service';

@Module({
  controllers: [PlansController],
  providers: [PlansService, StripeService],
})
export class PlansModule {}
