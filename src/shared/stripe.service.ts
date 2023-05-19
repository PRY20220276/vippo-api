import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(
      'sk_test_51HDym9I8AG5clu72c5wblZ6u3B90zzCg1gMmPiGoF9ehWOWd6ykEeuu6iSxs4wsOixnSqhQv640scR8OGLaHZQic00wsmkiCz5',
      {
        apiVersion: '2022-11-15',
      },
    );
  }

  async createCheckoutSession() {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pro Plan',
            },
            unit_amount: 1490, // $20.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://app.vippo.space/',
      cancel_url: 'https://app.vippo.space/',
    });

    return session;
  }
}
