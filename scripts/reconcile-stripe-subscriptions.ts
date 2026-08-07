import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

type SubscriptionRow = {
  id: string;
  user_id: string;
  source: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
};

function toIsoPeriodEnd(subscription: Stripe.Subscription): string | null {
  const value = (subscription as any).current_period_end;
  return typeof value === 'number' ? new Date(value * 1000).toISOString() : null;
}

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!stripeKey || !supabaseUrl || !serviceRoleKey) {
    console.error('Missing required env: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const stripe = new Stripe(stripeKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: rows, error } = await supabaseAdmin
    .from('subscriptions')
    .select('id,user_id,source,status,stripe_customer_id,stripe_subscription_id,current_period_end')
    .eq('source', 'stripe')
    .not('stripe_subscription_id', 'is', null)
    .order('updated_at', { ascending: true });

  if (error) {
    console.error('Failed to load Stripe-backed subscriptions.');
    process.exit(1);
  }

  let checked = 0;
  let repaired = 0;
  let unchanged = 0;
  let failed = 0;

  for (const row of (rows ?? []) as SubscriptionRow[]) {
    checked += 1;

    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id!);
      const nextStatus = stripeSubscription.status;
      const nextCustomerId =
        typeof stripeSubscription.customer === 'string'
          ? stripeSubscription.customer
          : stripeSubscription.customer?.id || null;
      const nextPeriodEnd = toIsoPeriodEnd(stripeSubscription);

      const noChanges =
        row.status === nextStatus &&
        row.stripe_customer_id === nextCustomerId &&
        row.current_period_end === nextPeriodEnd;

      if (noChanges) {
        unchanged += 1;
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: nextStatus,
          stripe_customer_id: nextCustomerId,
          current_period_end: nextPeriodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        .eq('source', 'stripe');

      if (updateError) {
        failed += 1;
        console.error(`Failed to update subscription row ${row.id}.`);
        continue;
      }

      repaired += 1;
    } catch {
      failed += 1;
      console.error(`Failed to reconcile Stripe subscription ${row.stripe_subscription_id}.`);
    }
  }

  console.log(JSON.stringify({ checked, repaired, unchanged, failed }, null, 2));
}

main().catch(() => {
  console.error('Unexpected reconciliation failure.');
  process.exit(1);
});
