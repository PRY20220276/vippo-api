import { Injectable } from '@nestjs/common';
import { StripeService } from '../shared/stripe.service';

@Injectable()
export class PlansService {
  constructor(private readonly stripeService: StripeService) {}

  async createPaymentSession() {
    return this.stripeService.createCheckoutSession();
  }
}
