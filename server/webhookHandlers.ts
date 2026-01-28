import { getStripeSync, getUncachableStripeClient, getStripeSecretKey } from './stripeClient';
import { storage } from './storage';
import Stripe from 'stripe';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const stripe = await getUncachableStripeClient();
    const sync = await getStripeSync();
    
    // First, let stripe-replit-sync handle the sync
    await sync.processWebhook(payload, signature);
    
    // Now handle custom business logic for specific events
    // Get webhook secret from Stripe sync config
    let event: Stripe.Event;
    try {
      // Parse the event without verification since sync already verified
      event = JSON.parse(payload.toString()) as Stripe.Event;
    } catch (err) {
      console.error('Failed to parse webhook payload:', err);
      return;
    }
    
    console.log(`Processing Stripe event: ${event.type}`);
    
    // Handle subscription events
    if (event.type === 'customer.subscription.deleted' || 
        event.type === 'customer.subscription.updated') {
      await WebhookHandlers.handleSubscriptionEvent(event);
    }
    
    // Handle checkout session completed (for updating subscription ID)
    if (event.type === 'checkout.session.completed') {
      await WebhookHandlers.handleCheckoutCompleted(event);
    }
  }
  
  static async handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    
    console.log(`Subscription event: ${event.type} for customer ${customerId}`);
    
    // Find user by Stripe customer ID
    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.log(`No user found for Stripe customer ${customerId}`);
      return;
    }
    
    // Map Stripe subscription status to our status
    let newStatus: string;
    if (event.type === 'customer.subscription.deleted') {
      newStatus = 'cancelled';
    } else {
      // subscription.updated - check the actual status
      const stripeStatus = subscription.status;
      if (stripeStatus === 'active' || stripeStatus === 'trialing') {
        newStatus = 'active';
      } else if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') {
        newStatus = 'past_due';
      } else if (stripeStatus === 'canceled' || stripeStatus === 'incomplete_expired') {
        newStatus = 'cancelled';
      } else {
        newStatus = stripeStatus;
      }
    }
    
    console.log(`Updating user ${user.id} subscription status to: ${newStatus}`);
    await storage.updateUser(user.id, { subscriptionStatus: newStatus });
    
    // If subscription is cancelled, log for visibility
    if (newStatus === 'cancelled' && user.role === 'therapist') {
      console.log(`NOTICE: Therapist ${user.email} subscription cancelled. Their clients may need reassignment.`);
    }
  }
  
  static async handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Only handle subscription checkouts
    if (session.mode !== 'subscription') {
      return;
    }
    
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    
    if (!customerId || !subscriptionId) {
      return;
    }
    
    console.log(`Checkout completed for subscription ${subscriptionId}`);
    
    // Find and update user
    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.log(`No user found for Stripe customer ${customerId}`);
      return;
    }
    
    console.log(`Updating user ${user.id} with subscription ID: ${subscriptionId}`);
    await storage.updateUser(user.id, { 
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: 'active'
    });
  }
}
