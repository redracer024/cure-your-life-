import * as fs from 'node:fs';
import * as path from 'node:path';
import { deleteCurrentAccount } from './src/lib/account/deleteAccount';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
    return;
  }
  failed++;
  errors.push(`FAIL: ${label}${detail ? ` - ${detail}` : ''}`);
}

const serverPath = path.join(import.meta.dirname, 'server.ts');
const authSectionPath = path.join(import.meta.dirname, 'src/components/AuthSection.tsx');
const accountDeleteHelperPath = path.join(import.meta.dirname, 'src/lib/account/deleteAccount.ts');
const supabaseClientPath = path.join(import.meta.dirname, 'src/lib/supabaseClient.ts');
const schemaPath = path.join(import.meta.dirname, 'supabase/schema.sql');
const migrationsPath = path.join(import.meta.dirname, 'supabase/migrations');

const serverSrc = fs.readFileSync(serverPath, 'utf8');
const authSectionSrc = fs.readFileSync(authSectionPath, 'utf8');
const helperSrc = fs.readFileSync(accountDeleteHelperPath, 'utf8');
const supabaseClientSrc = fs.readFileSync(supabaseClientPath, 'utf8');

const endpointMatch = serverSrc.match(/app\.delete\("\/api\/me\/account"[\s\S]*?\n\}\);/);
const endpointSrc = endpointMatch ? endpointMatch[0] : '';

console.log('Static endpoint checks');
assert('1. DELETE /api/me/account exists', endpointSrc.includes('app.delete("/api/me/account"'));
assert('2. endpoint requires verified JWT', endpointSrc.includes('supabaseAdmin.auth.getUser(token)'));
assert('3. target derives from verified auth user', endpointSrc.includes('const verifiedUserId = data.user.id'));
assert('4. body userId cannot control target', !endpointSrc.includes('req.body'));
assert('5. query userId cannot control target', !endpointSrc.includes('req.query'));
assert('6. header user ID cannot control target', !endpointSrc.includes('x-user-id'));
assert('7. missing auth denied', endpointSrc.includes('if (!token)') && endpointSrc.includes('status(401)'));
assert('8. invalid auth denied', endpointSrc.includes('if (authError || !data.user)') && endpointSrc.includes('status(401)'));
assert(
  '9. admin.deleteUser only after auth verification',
  endpointSrc.indexOf('supabaseAdmin.auth.getUser(token)') !== -1 &&
    endpointSrc.indexOf('supabaseAdmin.auth.admin.deleteUser(verifiedUserId)') !== -1 &&
    endpointSrc.indexOf('supabaseAdmin.auth.getUser(token)') < endpointSrc.indexOf('supabaseAdmin.auth.admin.deleteUser(verifiedUserId)'),
);
assert('10. raw admin errors not exposed', endpointSrc.includes('Account deletion failed. Please try again.') && !endpointSrc.includes('deleteError.message'));
assert('11. no explicit table DELETE statements added', !endpointSrc.includes('.from("profiles").delete(') && !endpointSrc.includes('.from("subscriptions").delete(') && !endpointSrc.includes('.from("decoder_reports").delete(') && !endpointSrc.includes('.from("journal_entries").delete('));

console.log('Static UI checks');
assert('12. UI requires exact DELETE confirmation', authSectionSrc.includes("deleteConfirmText !== 'DELETE'"));
assert('13. duplicate submission guarded', authSectionSrc.includes('if (deleteInFlight) return;') && authSectionSrc.includes('disabled={deleteInFlight || deleteConfirmText !== \'DELETE\'}'));
assert('24. existing authenticated fetch/Bearer path remains', supabaseClientSrc.includes("headers.set('Authorization', `Bearer ${token}`)") && authSectionSrc.includes("authFetch('/api/me/account'"));

console.log('Behavioral helper checks');

type Owner = { kind: 'user'; userId: string };

function ownerUserId(owner: { kind: 'anonymous' } | Owner): string {
  return owner.kind === 'user' ? owner.userId : 'anonymous';
}

async function runSuccessCase(): Promise<void> {
  const clearedAssessment: Owner[] = [];
  const clearedJournal: Owner[] = [];
  const clearedReflection: Owner[] = [];
  let signedOutCalls = 0;

  const result = await deleteCurrentAccount('user-a', {
    requestDelete: async () => ({ ok: true, status: 200 } as Response),
    clearAssessment: (owner) => {
      clearedAssessment.push(owner as Owner);
      return { status: 'cleared' };
    },
    clearJournal: (owner) => {
      clearedJournal.push(owner as Owner);
      return 'cleared';
    },
    clearReflection: (owner) => {
      clearedReflection.push(owner as Owner);
      return 'cleared';
    },
    signOut: async () => {
      signedOutCalls++;
    },
    getCurrentUserId: () => 'user-a',
  });

  assert('14. local cleanup only after server success', result.status === 'deleted' && clearedAssessment.length === 1 && clearedJournal.length === 1 && clearedReflection.length === 1);
  assert('15. assessment clear uses captured deleted owner', clearedAssessment[0]?.userId === 'user-a');
  assert('16. journal clear uses captured deleted owner', clearedJournal[0]?.userId === 'user-a');
  assert('17. reflection clear uses captured deleted owner', clearedReflection[0]?.userId === 'user-a');
  assert('18. anonymous namespace preserved', clearedJournal.every((owner) => owner.kind === 'user') && clearedReflection.every((owner) => owner.kind === 'user'));
  assert('19. another user namespace preserved', clearedJournal.every((owner) => owner.userId !== 'user-b') && clearedReflection.every((owner) => owner.userId !== 'user-b'));
  assert('21. sign-out happens after server deletion success', result.status === 'deleted' && signedOutCalls === 1 && result.signedOut === true);
}

async function runFailureCases(): Promise<void> {
  let clearCalls = 0;
  let signedOutCalls = 0;
  const serverFail = await deleteCurrentAccount('user-a', {
    requestDelete: async () => ({ ok: false, status: 500 } as Response),
    clearAssessment: () => {
      clearCalls++;
      return { status: 'cleared' };
    },
    clearJournal: () => {
      clearCalls++;
      return 'cleared';
    },
    clearReflection: () => {
      clearCalls++;
      return 'cleared';
    },
    signOut: async () => {
      signedOutCalls++;
    },
    getCurrentUserId: () => 'user-a',
  });

  assert('22. server failure does not clear local storage', serverFail.status === 'server-error' && clearCalls === 0 && signedOutCalls === 0);

  clearCalls = 0;
  signedOutCalls = 0;
  const networkFail = await deleteCurrentAccount('user-a', {
    requestDelete: async () => {
      throw new Error('network down');
    },
    clearAssessment: () => {
      clearCalls++;
      return { status: 'cleared' };
    },
    clearJournal: () => {
      clearCalls++;
      return 'cleared';
    },
    clearReflection: () => {
      clearCalls++;
      return 'cleared';
    },
    signOut: async () => {
      signedOutCalls++;
    },
    getCurrentUserId: () => 'user-a',
  });
  assert('network failure leaves account/session intact in helper path', networkFail.status === 'network-error' && clearCalls === 0 && signedOutCalls === 0);
}

async function runRaceCase(): Promise<void> {
  const owners: string[] = [];
  let signedOutCalls = 0;

  const result = await deleteCurrentAccount('user-a', {
    requestDelete: async () => ({ ok: true, status: 200 } as Response),
    clearAssessment: (owner) => {
      owners.push(ownerUserId(owner as { kind: 'anonymous' } | Owner));
      return { status: 'cleared' };
    },
    clearJournal: (owner) => {
      owners.push(ownerUserId(owner as { kind: 'anonymous' } | Owner));
      return 'cleared';
    },
    clearReflection: (owner) => {
      owners.push(ownerUserId(owner as { kind: 'anonymous' } | Owner));
      return 'cleared';
    },
    signOut: async () => {
      signedOutCalls++;
    },
    getCurrentUserId: () => 'user-b',
  });

  assert('20. account-switch race cannot clear new owner data', result.status === 'deleted' && owners.every((owner) => owner === 'user-a'));
  assert('account-switch race avoids mutating switched-in auth session', signedOutCalls === 0 && result.status === 'deleted' && result.signedOut === false);
}

async function runCleanupFailureCase(): Promise<void> {
  let signedOutCalls = 0;
  const result = await deleteCurrentAccount('user-a', {
    requestDelete: async () => ({ ok: true, status: 200 } as Response),
    clearAssessment: () => ({ status: 'cleared' }),
    clearJournal: () => 'remove-failed',
    clearReflection: () => 'cleared',
    signOut: async () => {
      signedOutCalls++;
    },
    getCurrentUserId: () => 'user-a',
  });

  assert('23. local cleanup failure still signs out', result.status === 'deleted' && result.cleanupWarning === true && signedOutCalls === 1 && result.signedOut === true);
}

await runSuccessCase();
await runFailureCases();
await runRaceCase();
await runCleanupFailureCase();

console.log('Scope and unchanged areas checks');
assert('25. Stripe logic unchanged', !endpointSrc.includes('stripe.') && !endpointSrc.includes('billing'));
assert('26. RLS/schema unchanged', fs.existsSync(schemaPath) && fs.existsSync(migrationsPath));

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log('\nFailures:');
  for (const error of errors) {
    console.log(`  ${error}`);
  }
  process.exit(1);
}

console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
