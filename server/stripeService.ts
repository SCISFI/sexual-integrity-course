import { getUncachableStripeClient } from './stripeClient';
import { db } from './db';
import { sql } from 'drizzle-orm';

export class StripeService {
  // Create customer in Stripe
  async createCustomer(email: string, userId: string, name?: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });
  }

  // Create checkout session for therapist subscription with 30-day free trial
  async createTherapistSubscriptionCheckout(customerId: string, priceId: string, successUrl: string, cancelUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 30,
      },
    });
  }

  // Create checkout session for client week payment (one-time)
  async createWeekPaymentCheckout(customerId: string, priceId: string, weekNumber: number, userId: string, therapistId: string | null, successUrl: string, cancelUrl: string) {
    const stripe = await getUncachableStripeClient();
    // Use {CHECKOUT_SESSION_ID} template variable - Stripe replaces this with the actual session ID
    const successUrlWithSession = successUrl + (successUrl.includes('?') ? '&' : '?') + 'session_id={CHECKOUT_SESSION_ID}';
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: successUrlWithSession,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        weekNumber: weekNumber.toString(),
        userId,
        therapistId: therapistId || '',
      },
    });
  }

  // Create customer portal session
  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // Cancel subscription at period end (no refund - subscription remains active until period ends)
  async cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<{ success: boolean; periodEnd: Date | null; error?: string }> {
    const stripe = await getUncachableStripeClient();
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      const periodEnd = (subscription as any).current_period_end;
      return {
        success: true,
        periodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      };
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      return {
        success: false,
        periodEnd: null,
        error: error.message || 'Failed to cancel subscription',
      };
    }
  }

  // Get subscription details including period end date
  async getSubscriptionDetails(subscriptionId: string): Promise<{ status: string; cancelAtPeriodEnd: boolean; periodEnd: Date | null } | null> {
    const stripe = await getUncachableStripeClient();
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = (subscription as any).current_period_end;
      return {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        periodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      };
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      return null;
    }
  }

  // Query products from stripe schema
  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active}`
    );
    return result.rows;
  }

  async listProductsWithPrices(active = true) {
    const result = await db.execute(
      sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = ${active}
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async getPricesForProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
    );
    return result.rows;
  }

  // Verify a specific checkout session by ID for week payment
  async verifyWeekPaymentSession(sessionId: string, expectedUserId: string, expectedWeekNumber: number): Promise<{ verified: boolean; therapistId: string | null; paymentId: string | null; amount: number | null; weekNumber: number | null }> {
    const stripe = await getUncachableStripeClient();
    
    try {
      // Retrieve the specific checkout session
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      // Verify payment was completed
      if (session.payment_status !== 'paid') {
        console.log('Session payment status is not paid:', session.payment_status);
        return { verified: false, therapistId: null, paymentId: null, amount: null, weekNumber: null };
      }
      
      // Verify metadata matches expected values
      const sessionWeekNumber = parseInt(session.metadata?.weekNumber || '0', 10);
      const sessionUserId = session.metadata?.userId;
      
      if (sessionUserId !== expectedUserId) {
        console.log('Session userId mismatch');
        return { verified: false, therapistId: null, paymentId: null, amount: null, weekNumber: null };
      }
      
      if (sessionWeekNumber !== expectedWeekNumber) {
        console.log('Session weekNumber mismatch');
        return { verified: false, therapistId: null, paymentId: null, amount: null, weekNumber: null };
      }
      
      return {
        verified: true,
        therapistId: session.metadata?.therapistId || null,
        paymentId: session.payment_intent as string || session.id,
        amount: session.amount_total || 1499,
        weekNumber: sessionWeekNumber,
      };
    } catch (error) {
      console.error('Error verifying checkout session:', error);
      return { verified: false, therapistId: null, paymentId: null, amount: null, weekNumber: null };
    }
  }
}

export const stripeService = new StripeService();
