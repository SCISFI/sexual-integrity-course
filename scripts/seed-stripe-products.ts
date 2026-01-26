// Seed script for Stripe products
// Run with: npx tsx scripts/seed-stripe-products.ts

import Stripe from 'stripe';

async function getStripeClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const connectorName = 'stripe';
  const targetEnvironment = 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings?.settings?.secret) {
    throw new Error('Stripe connection not found');
  }

  return new Stripe(connectionSettings.settings.secret);
}

async function createProducts() {
  const stripe = await getStripeClient();
  console.log('Connected to Stripe');

  // Check if products already exist
  const existingProducts = await stripe.products.search({ 
    query: "name:'Therapist Monthly Subscription'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('Products already exist, skipping creation');
    console.log('Existing products:', existingProducts.data.map(p => p.name));
    return;
  }

  // Create Therapist Monthly Subscription
  console.log('Creating Therapist Subscription product...');
  const therapistSubscription = await stripe.products.create({
    name: 'Therapist Monthly Subscription',
    description: 'Monthly access to the Sexual Integrity curriculum platform for therapists. Manage and monitor client progress.',
    metadata: {
      type: 'therapist_subscription',
      role: 'therapist',
    },
  });

  const therapistPrice = await stripe.prices.create({
    product: therapistSubscription.id,
    unit_amount: 4900, // $49.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      type: 'therapist_subscription',
    },
  });

  console.log(`Created Therapist Subscription: ${therapistSubscription.id} with price ${therapistPrice.id}`);

  // Create Client Week Access (one-time payment)
  console.log('Creating Client Week Access product...');
  const clientWeekAccess = await stripe.products.create({
    name: 'Weekly Lesson Access',
    description: 'Access to one week of the 16-week Sexual Integrity curriculum, including lessons, exercises, and reflection activities.',
    metadata: {
      type: 'client_week',
      role: 'client',
    },
  });

  const weekPrice = await stripe.prices.create({
    product: clientWeekAccess.id,
    unit_amount: 1499, // $14.99
    currency: 'usd',
    metadata: {
      type: 'client_week',
    },
  });

  console.log(`Created Client Week Access: ${clientWeekAccess.id} with price ${weekPrice.id}`);

  console.log('\n=== Products Created Successfully ===');
  console.log(`Therapist Subscription Price ID: ${therapistPrice.id}`);
  console.log(`Client Week Access Price ID: ${weekPrice.id}`);
  console.log('\nThese will be synced to your database automatically via webhooks.');
}

createProducts()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating products:', error);
    process.exit(1);
  });
