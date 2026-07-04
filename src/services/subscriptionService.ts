import { SubscriptionStatus } from '@/types/models';

export const subscriptionService = {
  async startStripeCheckout(plan: 'monthly' | 'yearly'): Promise<{ checkoutUrl?: string; status: SubscriptionStatus }> {
    console.log('TODO: create Stripe checkout session', plan);
    return {
      status: plan === 'monthly' ? 'premium_monthly' : 'premium_yearly',
    };
  },

  async manageBilling(): Promise<void> {
    console.log('TODO: open Stripe customer portal');
  },
};
