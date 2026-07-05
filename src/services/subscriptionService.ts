import { SubscriptionStatus } from '@/types/models';

export type SubscriptionCheckoutResult = {
  checkoutUrl?: string;
  status?: SubscriptionStatus;
  message?: string;
};

export const subscriptionService = {
  async startStripeCheckout(plan: 'monthly' | 'yearly'): Promise<SubscriptionCheckoutResult> {
    console.log('TODO: create Stripe checkout session', plan);
    return {
      message: 'Stripe checkout is not configured in this build.',
    };
  },

  async manageBilling(): Promise<void> {
    console.log('TODO: open Stripe customer portal');
  },
};
