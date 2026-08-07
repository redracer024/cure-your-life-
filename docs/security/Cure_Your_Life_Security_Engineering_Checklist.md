# Cure Your Life+ — Security, Privacy & Engineering Verification Checklist

> **Purpose:** Builder-facing verification checklist for AI-generated or AI-assisted software.
> Check a box only after inspecting the real implementation and recording evidence.
>
> **Rule:** “Looks safe,” “probably handled by the framework,” and “the code compiles” are not verification.

## How to use this checklist

For every applicable item:

- [ ] **VERIFIED** — implementation inspected and evidence recorded
- [ ] **FAILED / NEEDS FIX** — vulnerability or engineering gap found
- [ ] **NOT APPLICABLE** — explain why
- [ ] **NOT VERIFIED** — cannot currently prove the control exists

For each **VERIFIED** item, record:
- Files/components inspected
- Exact safeguard
- How it was tested
- Negative/adversarial case tested
- Result
- Remaining limitation

Severity:
- **CRITICAL** — account takeover, RCE, secret exposure, payment compromise, cross-user private-data exposure
- **HIGH** — significant authorization, injection, privacy, or entitlement failure
- **MEDIUM** — narrower exploitability or meaningful defense-in-depth weakness
- **LOW** — hygiene/hardening/observability concern
- **INFO** — architectural fact or future recommendation

---

# 1. Application Security & Injection

## 1.1 Input Validation
- [ ] All externally controlled input has an explicit validation boundary.
- [ ] Server-side validation exists even when client-side validation exists.
- [ ] Allowlists/schemas are used where practical.
- [ ] IDs, dates, enums, URLs, filenames, quantities, and pagination are validated.
- [ ] Oversized inputs are bounded/rejected.
- [ ] Nested JSON depth/size is bounded where appropriate.
- [ ] Unknown object properties are rejected or safely ignored.
- [ ] Validation errors do not expose stack traces/internal schemas.
- [ ] AI-generated endpoints were checked for “TypeScript-only” fake validation.

**Evidence / notes:**

## 1.2 SQL Injection
- [ ] No SQL concatenates user-controlled strings.
- [ ] Parameterized queries/prepared statements are used.
- [ ] Dynamic identifiers are allowlisted.
- [ ] Sort/order/filter input cannot inject SQL.
- [ ] Search/filter features tested with SQL metacharacters.
- [ ] Raw SQL/RPC reviewed separately.
- [ ] Supabase/PostgREST filters are not built from arbitrary unsanitized expressions.
- [ ] Database functions avoid unsafe dynamic `EXECUTE`.

**Adversarial checks**
- [ ] `' OR 1=1 --`
- [ ] Quote termination
- [ ] Malformed filter expressions
- [ ] Encoded injection attempts

**Evidence / notes:**

## 1.3 NoSQL / Query Injection
- [ ] User JSON cannot inject query operators.
- [ ] Query objects use known fields only.
- [ ] Search filters cannot alter query structure.
- [ ] Prototype pollution cannot affect query construction.

**Evidence / notes:**

## 1.4 Command / Shell Injection
- [ ] No untrusted input reaches shell command strings.
- [ ] Argument arrays are used where command execution is required.
- [ ] Filenames/paths are validated.
- [ ] Environment values are not blindly interpolated into commands.
- [ ] AI-generated helper scripts were reviewed for shell execution.

**Evidence / notes:**

## 1.5 Cross-Site Scripting (XSS)
- [ ] No unsafe `dangerouslySetInnerHTML` without sanitization.
- [ ] User HTML/Markdown is sanitized.
- [ ] Unsafe URL schemes such as `javascript:` are rejected.
- [ ] User-controlled SVG is handled safely.
- [ ] LLM output rendered in UI is treated as untrusted.
- [ ] Stored content tested for persistent XSS.
- [ ] DOM XSS sources/sinks reviewed.
- [ ] Error messages do not reflect unsanitized input.

**Evidence / notes:**

## 1.6 Insecure Deserialization
- [ ] No unsafe native object deserialization on untrusted data.
- [ ] JSON is schema-validated before sensitive use.
- [ ] Stored assessment/session payloads are validated before trust.
- [ ] Prototype-polluting properties are not trusted.
- [ ] Deserialization failure is non-executable and fails safely.

**Evidence / notes:**

## 1.7 SSRF
- [ ] Server-side fetch endpoints reject arbitrary unvalidated URLs.
- [ ] Allowed URL schemes are restricted.
- [ ] Localhost/private/link-local/cloud metadata ranges are blocked where needed.
- [ ] Redirect destinations are revalidated.
- [ ] DNS rebinding risk considered if relevant.
- [ ] Response size/time limits exist.

**Evidence / notes:**

## 1.8 CSRF
- [ ] Authentication mechanism classified correctly.
- [ ] Cookie-authenticated state-changing endpoints use CSRF defenses where required.
- [ ] SameSite policy reviewed.
- [ ] Origin/Referer validation used where appropriate.
- [ ] GET endpoints do not mutate state.
- [ ] CORS is not mistaken for CSRF protection.

**Evidence / notes:**

---

# 2. Authentication, Authorization & Session Security

## 2.1 Authentication Architecture
- [ ] Auth provider documented.
- [ ] Auth initialization uses intended production environment.
- [ ] Session restore verified.
- [ ] Logout clears/invalidates correct state.
- [ ] Account switching cannot retain previous user's private state.
- [ ] Auth loading cannot initialize wrong anonymous/user owner.
- [ ] Auth errors fail closed.
- [ ] No production test-auth bypass.
- [ ] No hidden fallback user.
- [ ] Auth decisions do not rely solely on client-supplied headers.

**Evidence / notes:**

## 2.2 Password & Credential Handling
- [ ] Passwords are never logged.
- [ ] Reset tokens are short-lived/one-time where applicable.
- [ ] Brute-force protections exist.
- [ ] MFA need assessed.
- [ ] Account enumeration through reset/login errors minimized.

**Evidence / notes:**

## 2.3 BOLA / IDOR
For every user-owned resource:
- [ ] Read checks ownership server/database-side.
- [ ] Update checks ownership.
- [ ] Delete checks ownership.
- [ ] Download/file access checks ownership.
- [ ] Bulk operations enforce ownership item-by-item.
- [ ] UUID unpredictability is not treated as authorization.
- [ ] Client filtering is not treated as authorization.

**Required adversarial test**
- [ ] User A creates resource.
- [ ] User B obtains/guesses ID.
- [ ] User B read fails.
- [ ] User B update fails.
- [ ] User B delete fails.

**Evidence / notes:**

## 2.4 Function-Level Authorization
- [ ] Admin functions enforced server-side.
- [ ] Premium-sensitive functions enforced server-side/database-side.
- [ ] Hidden UI is not treated as access control.
- [ ] RPC/database functions verify caller authorization.
- [ ] Server does not trust client `role`, `isAdmin`, or `isPro`.

**Evidence / notes:**

## 2.5 Session & Token Handling
- [ ] JWT signature verification delegated to trusted library/provider.
- [ ] Expiration enforced.
- [ ] Issuer/audience checks correct where applicable.
- [ ] `alg:none` cannot be accepted.
- [ ] Tokens not logged.
- [ ] Tokens not placed in URLs.
- [ ] Browser token storage documented.
- [ ] Cookies use Secure/HttpOnly/SameSite when applicable.
- [ ] Refresh behavior understood.
- [ ] Revoked/deleted users lose access.

**Evidence / notes:**

---

# 3. Secrets, Cryptography & Randomness

## 3.1 Secret Exposure
Repository/build scan:
- [ ] Supabase service-role key
- [ ] Database password
- [ ] Stripe secret key
- [ ] Stripe webhook secret
- [ ] Gemini/OpenAI/private API keys
- [ ] Private signing keys
- [ ] OAuth client secrets
- [ ] JWT signing secrets
- [ ] Google Play service account key
- [ ] Hardcoded bearer tokens
- [ ] Real secrets in committed `.env`

Additional:
- [ ] Every `VITE_*` variable is treated as public.
- [ ] No server secret exposed through `VITE_*`.
- [ ] Production browser bundle searched for secrets.
- [ ] Logs/errors do not print auth headers/secrets.
- [ ] Example config contains placeholders only.

**Evidence / notes:**

## 3.2 Cryptography
- [ ] No MD5/SHA-1 for password/security-token hashing.
- [ ] Password hashing handled by secure maintained provider/library.
- [ ] Custom encryption uses authenticated encryption where unavoidable.
- [ ] AES-ECB absent.
- [ ] Keys not hardcoded.
- [ ] Nonces/IVs generated correctly.
- [ ] No handwritten cryptography.
- [ ] Encryption claims match reality.

**Evidence / notes:**

## 3.3 Randomness
- [ ] Security tokens do not use `Math.random()`.
- [ ] Reset/invite/share tokens use cryptographically secure RNG.
- [ ] Session IDs are not predictable.
- [ ] Tokens/codes have sufficient entropy.

**Evidence / notes:**

---

# 4. API, Network & Infrastructure

## 4.1 HTTPS/TLS
- [ ] Production HTTPS-only.
- [ ] HTTP safely redirects to HTTPS.
- [ ] Certificate validation not disabled.
- [ ] No `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- [ ] No `verify=False` equivalent.
- [ ] Webhooks use HTTPS.
- [ ] No mixed content.

**Evidence / notes:**

## 4.2 CORS
- [ ] Allowed origins explicit.
- [ ] `*` not combined with credentials.
- [ ] Dev/prod origins intentionally separated.
- [ ] Allowed methods/headers minimized.
- [ ] Error paths do not broaden CORS.

**Evidence / notes:**

## 4.3 Rate Limiting & Abuse
Inventory:
- [ ] login/signup/reset
- [ ] AI/Gemini/LLM endpoints
- [ ] support/contact
- [ ] checkout creation
- [ ] webhooks
- [ ] upload
- [ ] search/report generation
- [ ] email/SMS

For each:
- [ ] appropriate throttle
- [ ] authenticated identity used when possible
- [ ] IP fallback where appropriate
- [ ] safe rate-limit response
- [ ] `Retry-After` where useful
- [ ] limiter cannot be bypassed with client-controlled identity
- [ ] in-memory limiter limitation documented for multi-instance deployments

**Evidence / notes:**

## 4.4 Error Handling
- [ ] No public stack traces.
- [ ] DB errors sanitized.
- [ ] Webhook errors sanitized.
- [ ] Unknown errors generic publicly.
- [ ] Detailed internal errors remain protected.
- [ ] Catch-all blocks do not silently swallow important failures.
- [ ] Security failures fail closed.

**Evidence / notes:**

## 4.5 Security Headers
Verify:
- [ ] Content-Security-Policy
- [ ] X-Content-Type-Options
- [ ] Referrer-Policy
- [ ] Permissions-Policy
- [ ] frame-ancestors/clickjacking defense
- [ ] Strict-Transport-Security
- [ ] private-data cache controls

**Evidence / notes:**

---

# 5. Supabase-Specific Security

## 5.1 Client Configuration
- [ ] Browser uses only public/publishable/anon Supabase credential.
- [ ] `service_role` never reaches client.
- [ ] Supabase URL is intended project.
- [ ] Dev/prod project separation intentional.
- [ ] No DB password in browser code.
- [ ] Client cannot directly control trusted admin/premium fields.

**Evidence / notes:**

## 5.2 Row Level Security
For every exposed table:
- [ ] RLS enabled.
- [ ] SELECT policy reviewed.
- [ ] INSERT policy reviewed.
- [ ] UPDATE policy reviewed.
- [ ] DELETE policy reviewed.
- [ ] Ownership uses `auth.uid()` or equivalent.
- [ ] INSERT cannot claim another user.
- [ ] UPDATE cannot change owner improperly.
- [ ] Anonymous access intentional/documented.
- [ ] No inappropriate `USING (true)`.
- [ ] No overly broad authenticated-user policy.

Cross-account:
- [ ] User A cannot SELECT User B.
- [ ] User A cannot UPDATE User B.
- [ ] User A cannot DELETE User B.
- [ ] User A cannot INSERT row owned by User B.
- [ ] Anonymous cannot access private user data.

**Evidence / notes:**

## 5.3 Supabase Functions / RPC
- [ ] SECURITY DEFINER functions inventoried.
- [ ] Safe `search_path`.
- [ ] Privileged functions authorize caller.
- [ ] User-id parameters cannot bypass ownership.
- [ ] RLS bypass intentional and safe where used.
- [ ] Dynamic SQL injection reviewed.
- [ ] Execute privileges minimal.

**Evidence / notes:**

## 5.4 Supabase Storage
Per bucket:
- [ ] public/private status documented.
- [ ] Upload/read/update/delete policies reviewed.
- [ ] Object path ownership enforced.
- [ ] User cannot overwrite another user's file.
- [ ] MIME restrictions where needed.
- [ ] File-size limits.
- [ ] HTML/SVG active content handled safely.
- [ ] Signed URL lifetime reasonable.

**Evidence / notes:**

## 5.5 Security Advisor
- [ ] Supabase Security Advisor reviewed.
- [ ] Critical findings recorded.
- [ ] RLS findings recorded.
- [ ] Function/search-path warnings recorded.
- [ ] Configuration warnings recorded.
- [ ] Unresolved findings have remediation tickets.

**Evidence / notes:**

---

# 6. Multi-Tenancy & Cross-User Isolation

- [ ] Every user table has trustworthy ownership relationship.
- [ ] Ownership derives from authenticated identity.
- [ ] Client user ID is never sole authorization evidence.
- [ ] Shared-browser account switching reviewed.
- [ ] Local/session storage scoped appropriately.
- [ ] Cached data cannot leak between accounts.
- [ ] Sign-out does not expose prior user's private state.
- [ ] Stale async requests cannot repopulate prior user's state.
- [ ] Optimistic updates cannot cross tenant boundaries.
- [ ] Admin paths are explicitly privileged, not globally weakened.

**Evidence / notes:**

---

# 7. Payments, Subscription & Premium Entitlements

## 7.1 Entitlement Model
- [ ] One authoritative source of premium status exists.
- [ ] localStorage cannot grant authoritative Pro.
- [ ] React/devtools state cannot grant authoritative Pro.
- [ ] Altering a client API response does not create persistent entitlement.
- [ ] Trusted verification required for entitlement changes.
- [ ] Expiration/current-period modeled.
- [ ] Cancellation behavior defined.
- [ ] Refund/revocation behavior defined.
- [ ] Account switching refreshes entitlement.
- [ ] Offline behavior does not grant indefinite unverified access.

**Evidence / notes:**

## 7.2 Stripe Web
- [ ] Checkout created server-side.
- [ ] Product/price IDs allowlisted server-side.
- [ ] Client cannot choose arbitrary price.
- [ ] Checkout tied to authenticated user.
- [ ] Webhook signature verified.
- [ ] Raw body handling correct.
- [ ] Webhook processing idempotent.
- [ ] Duplicate events safe.
- [ ] Subscription created/updated/deleted handled.
- [ ] Failed payment handled.
- [ ] Refund/revocation handled where needed.
- [ ] Stripe customer maps reliably to app user.
- [ ] Customer portal/subscription management reviewed.
- [ ] Webhook errors do not expose secrets.

**Evidence / notes:**

## 7.3 Google Play Billing / Android
- [ ] Billing architecture selected for Play-distributed paid digital features.
- [ ] Billing integration exists or explicitly marked missing.
- [ ] Product IDs/base plans centrally defined.
- [ ] Purchase token sent to trusted backend.
- [ ] Backend verifies purchase with Google Play Developer API.
- [ ] Client purchase callback alone cannot authorize Pro.
- [ ] Purchase acknowledgement/consumption handled.
- [ ] Restore purchases implemented.
- [ ] Renewal reconciled.
- [ ] Cancellation reconciled.
- [ ] Expiration reconciled.
- [ ] Refund/revocation reconciled.
- [ ] Pending purchases handled.
- [ ] Grace period/account hold behavior defined.
- [ ] Web + Android purchase sources normalize to one entitlement.
- [ ] Duplicate Stripe/Play purchase behavior defined.

**Evidence / notes:**

---

# 8. AI / LLM Application Security

## 8.1 Prompt Injection
- [ ] Every LLM input source inventoried.
- [ ] User text treated as untrusted.
- [ ] Retrieved/web/file content treated as untrusted.
- [ ] External content cannot redefine authority.
- [ ] Instruction/data boundaries explicit.
- [ ] High-risk actions independently authorized.
- [ ] Prompt injection cannot bypass DB authorization.
- [ ] Prompt injection cannot reveal secrets unavailable to model.

**Evidence / notes:**

## 8.2 Indirect Prompt Injection
- [ ] Web pages treated as hostile.
- [ ] Uploaded documents treated as hostile.
- [ ] Emails/messages treated as hostile.
- [ ] RAG content cannot authorize tool actions.
- [ ] Hidden metadata/HTML instructions untrusted.
- [ ] Tool calls have non-LLM policy checks.

**Evidence / notes:**

## 8.3 Insecure LLM Output Handling
- [ ] LLM output never sent directly to `eval()`.
- [ ] LLM output never directly executed as shell.
- [ ] LLM output never concatenated into SQL.
- [ ] Generated HTML sanitized.
- [ ] Generated URLs validated.
- [ ] Structured output schema-validated.
- [ ] Generated JSON cannot set unauthorized fields.
- [ ] Model output cannot directly alter admin/entitlement/security state.

**Evidence / notes:**

## 8.4 Excessive Agency
- [ ] AI tools have minimum permissions.
- [ ] Read/write capabilities separated where practical.
- [ ] Destructive actions require confirmation when appropriate.
- [ ] AI cannot access service-role credential from client.
- [ ] DB writes enforce independent authorization.
- [ ] File tools cannot escape intended directories.
- [ ] Network tools cannot access arbitrary internal services.
- [ ] Tool arguments validated outside model.
- [ ] Prompt compromise cannot escalate privileges.

**Evidence / notes:**

## 8.5 Prompt / Secret Leakage
- [ ] Secrets not included in prompts.
- [ ] Hidden prompts contain nothing dangerous if revealed.
- [ ] Private records minimized in prompts.
- [ ] Error messages do not echo full prompts.
- [ ] Prompt logs treated as sensitive.
- [ ] Model-provider retention/privacy settings documented where relevant.

**Evidence / notes:**

## 8.6 RAG / Vector DB
If applicable:
- [ ] Per-user/tenant retrieval authorization.
- [ ] User A cannot retrieve User B embeddings/docs.
- [ ] Ingestion source authorized.
- [ ] Poisoned docs cannot become trusted instructions.
- [ ] Retrieval metadata validated.
- [ ] Deletion propagates to vector store.
- [ ] Embeddings treated as potentially sensitive data.

**Evidence / notes:**

---

# 9. AI-Generated Code Failure Patterns

## 9.1 Plausible-but-Fake Security
- [ ] No comments claim security without real enforcement.
- [ ] No sensitive `TODO: validate user` remains.
- [ ] No stub authorization always succeeds.
- [ ] No mock auth/premium survives production.
- [ ] Base64 is never described as encryption.
- [ ] Client checks are never described as server authorization.
- [ ] UUID secrecy is never described as access control.
- [ ] CORS is never described as authentication.
- [ ] TypeScript interfaces are never described as runtime validation.
- [ ] Hidden UI is never described as authorization.

**Evidence / notes:**

## 9.2 Hallucinated APIs / SDK Behavior
- [ ] Security-sensitive methods exist in installed SDK version.
- [ ] Auth APIs checked against actual SDK.
- [ ] Billing APIs checked against actual SDK.
- [ ] Supabase behavior/policy assumptions verified.
- [ ] AI-generated config options really exist.
- [ ] Deprecated examples removed.
- [ ] Error handling matches real SDK return shapes.

**Evidence / notes:**

## 9.3 Negative Paths
For important features:
- [ ] unauthenticated
- [ ] wrong user
- [ ] malformed input
- [ ] missing input
- [ ] oversized input
- [ ] duplicate request
- [ ] expired session/token
- [ ] cancelled subscription
- [ ] revoked entitlement
- [ ] network timeout
- [ ] third-party outage
- [ ] storage unavailable
- [ ] database failure
- [ ] stale client state

**Evidence / notes:**

---

# 10. Supply Chain & Dependencies

## 10.1 Package Validation
- [ ] Every direct dependency is used.
- [ ] Package names verified against authoritative registry/project.
- [ ] Suspicious new/low-use packages reviewed.
- [ ] No package installed solely because AI invented a plausible name.
- [ ] Typosquatting checked for unusual packages.
- [ ] Install scripts reviewed for suspicious dependencies.
- [ ] Git dependencies pinned appropriately.
- [ ] Unexpected forks absent.

**Evidence / notes:**

## 10.2 Vulnerability Scanning
- [ ] `npm audit` or equivalent run.
- [ ] Critical findings reviewed.
- [ ] High findings reviewed.
- [ ] Medium findings triaged.
- [ ] Dev-only findings classified separately.
- [ ] No blind `--force` remediation.
- [ ] Unpatched findings documented.
- [ ] Updates tested before release.

**Evidence / notes:**

## 10.3 Lockfiles / Reproducibility
- [ ] Lockfile committed.
- [ ] CI uses deterministic install.
- [ ] Lockfile matches manifest.
- [ ] Clean-checkout production build works.
- [ ] Node/runtime version documented.
- [ ] No undeclared global dependency required.

**Evidence / notes:**

## 10.4 SBOM / Provenance
- [ ] SBOM considered/generated.
- [ ] Release maps to Git commit.
- [ ] CI permissions least privilege.
- [ ] Third-party Actions pinned/reviewed.
- [ ] Artifact signing considered where appropriate.

**Evidence / notes:**

---

# 11. Privacy, PII & Governance

## 11.1 Data Inventory
Inventory:
- [ ] account identity
- [ ] email
- [ ] assessment answers
- [ ] assessment results
- [ ] journal entries
- [ ] health/wellness reflections
- [ ] uploads
- [ ] payment identifiers
- [ ] device info
- [ ] analytics IDs
- [ ] IP addresses
- [ ] support communications
- [ ] AI prompts/responses

For each document storage location, purpose, retention, access, deletion path, third parties.

**Evidence / notes:**

## 11.2 Logging
- [ ] Passwords never logged.
- [ ] Auth tokens never logged.
- [ ] Payment credentials never logged.
- [ ] Assessment answers not logged unnecessarily.
- [ ] Journal text not logged unnecessarily.
- [ ] Sensitive request bodies redacted.
- [ ] Error-monitoring data collection understood.
- [ ] Log retention defined.

**Evidence / notes:**

## 11.3 Retention & Deletion
- [ ] Server data retention policy exists.
- [ ] Browser assessment retention documented.
- [ ] Account deletion path exists.
- [ ] Associated personal data removed/anonymized as required.
- [ ] Storage objects included.
- [ ] AI/vector data included where relevant.
- [ ] Legally retained payment records handled separately.
- [ ] Backup deletion limitations documented.
- [ ] Browser-local data after account deletion defined.

**Evidence / notes:**

## 11.4 Privacy Claims
- [ ] Privacy Policy matches implementation.
- [ ] “Stored only on this device” claims verified.
- [ ] No hidden transmission contrary to disclosure.
- [ ] AI-provider disclosures accurate.
- [ ] Analytics disclosures accurate.
- [ ] Payment-provider disclosures accurate.
- [ ] Retention claims accurate.
- [ ] Account-deletion claims accurate.
- [ ] No unprovable security guarantees.

**Evidence / notes:**

---

# 12. Licensing & Intellectual Property

- [ ] Direct dependency licenses reviewed.
- [ ] GPL/AGPL/copyleft compatibility reviewed.
- [ ] Required attribution/notices preserved.
- [ ] Suspicious AI reproduction of third-party code reviewed.
- [ ] Fonts/images/audio/assets have usage rights.
- [ ] Stock assets licensed.
- [ ] Store listing media rights documented.
- [ ] Open-source notices provided where required.

**Evidence / notes:**

---

# 13. QA, Resilience & Testing Blind Spots

## 13.1 Unit/Validator Quality
- [ ] Security-sensitive pure functions tested.
- [ ] Authorization helpers have negative tests.
- [ ] Malformed inputs tested.
- [ ] Boundaries tested.
- [ ] Clock logic deterministic where practical.
- [ ] Tests do not merely mirror implementation.
- [ ] Removing the security control would make relevant tests fail.

**Evidence / notes:**

## 13.2 Hallucinated Coverage
- [ ] Assertions test behavior, not keyword presence alone.
- [ ] Tests actually invoke target code.
- [ ] Mocks do not pre-guarantee success.
- [ ] Failure paths included.
- [ ] Unauthorized users included.
- [ ] Invalid/stale state included.
- [ ] Third-party failures included.
- [ ] Coverage percentage not treated as proof of security.

**Evidence / notes:**

## 13.3 Integration
- [ ] Auth + DB ownership verified.
- [ ] Payment + entitlement verified.
- [ ] Webhook + entitlement update verified.
- [ ] Account switching verified.
- [ ] Logout/private-data isolation verified.
- [ ] Third-party timeout verified.
- [ ] DB unavailable behavior verified.
- [ ] Invalid webhook verified.

**Evidence / notes:**

## 13.4 E2E Scope Discipline
- [ ] Browser E2E used only where browser behavior matters.
- [ ] Deterministic storage/pure logic tested without browser.
- [ ] Tests avoid unnecessary full-flow clicking.
- [ ] Fixtures begin near target behavior.
- [ ] Video/screenshots/traces generated only when useful.
- [ ] Cross-browser duplication intentional.
- [ ] Failures classified before rerun loops.

**Evidence / notes:**

---

# 14. Resilience & Performance

## 14.1 Network
- [ ] API timeout behavior defined.
- [ ] Retries bounded.
- [ ] Retries do not duplicate mutations.
- [ ] Offline mode does not corrupt state.
- [ ] Third-party outage has useful UX.
- [ ] Premium lookup failure fails conservatively.
- [ ] Uncertain payment status never grants unverified Pro.

**Evidence / notes:**

## 14.2 Database
- [ ] Failed writes surfaced safely.
- [ ] Multi-step mutations use transactions when needed.
- [ ] Idempotency used where needed.
- [ ] Unique constraints prevent critical duplicates.
- [ ] Foreign keys/constraints reinforce app validation.

**Evidence / notes:**

## 14.3 Resource Exhaustion
- [ ] Unbounded loops reviewed.
- [ ] Unbounded recursion reviewed.
- [ ] Query result limits exist.
- [ ] Pagination exists.
- [ ] N+1 patterns reviewed.
- [ ] LLM requests have budget/rate controls.
- [ ] Upload size limits exist.
- [ ] Body size limits exist.
- [ ] Regex DoS risk considered.
- [ ] Client storage growth bounded.

**Evidence / notes:**

---

# 15. File Upload Security

If uploads exist:
- [ ] Size limits enforced.
- [ ] Allowed MIME types defined.
- [ ] Extension not trusted alone.
- [ ] Filename sanitized.
- [ ] Path traversal blocked.
- [ ] Upload cannot overwrite app files.
- [ ] Public/private policy intentional.
- [ ] HTML/SVG active content handled safely.
- [ ] Malware scanning need assessed.
- [ ] Image libraries maintained.
- [ ] EXIF/location metadata considered.
- [ ] Signed URL expiry appropriate.

**Evidence / notes:**

---

# 16. Redirects, URLs & Deep Links

- [ ] Redirect destinations allowlisted.
- [ ] `returnTo`/`next` cannot create open redirect.
- [ ] OAuth redirect URIs minimized/exact.
- [ ] Deep-link parameters validated.
- [ ] Android app links cannot invoke privileged action without auth.
- [ ] Custom schemes do not expose tokens.
- [ ] Password reset links avoid token leakage.

**Evidence / notes:**

---

# 17. Browser Storage Security

Inventory localStorage/sessionStorage/IndexedDB/cookies/cache.

- [ ] Sensitive keys inventoried.
- [ ] Assessment storage account-scoped.
- [ ] Anonymous isolated from signed-in users.
- [ ] User A isolated from User B.
- [ ] Expired in-progress assessment rejected.
- [ ] Completed-result retention intentional.
- [ ] Invalid serialized state rejected.
- [ ] Sign-out cannot expose previous user's assessment.
- [ ] Clear affects only active owner where intended.
- [ ] Failures do not expose raw key/owner IDs.
- [ ] No private API secret stored client-side.

**Evidence / notes:**

---

# 18. Android / Google Play Security & Release

## 18.1 Packaging
- [ ] Android architecture identified.
- [ ] Package/application ID finalized.
- [ ] Release signing documented.
- [ ] Signing key not committed.
- [ ] Signing credentials not exposed.
- [ ] Release AAB can be produced.
- [ ] Debug-only capabilities disabled.
- [ ] WebView debugging disabled if applicable.
- [ ] Release not debuggable.
- [ ] Backup/export settings reviewed.
- [ ] Network security config reviewed.

**Evidence / notes:**

## 18.2 WebView / Capacitor
If applicable:
- [ ] Arbitrary navigation restricted.
- [ ] External URLs handled safely.
- [ ] JS/native bridge minimal.
- [ ] Bridge arguments validated.
- [ ] Untrusted content cannot call privileged bridge methods.
- [ ] File URL access restricted.
- [ ] Mixed content disabled unless required.
- [ ] Origin restrictions configured.

**Evidence / notes:**

## 18.3 Play Privacy / Account Requirements
- [ ] Privacy Policy URL exists and matches app.
- [ ] Data Safety inventory complete.
- [ ] Account deletion mechanism exists if required.
- [ ] In-app deletion/access path reviewed.
- [ ] Third-party SDK data collection inventoried.
- [ ] Advertising ID usage identified.
- [ ] Sensitive wellness-data handling reviewed.
- [ ] Store listing does not claim clinical validation/diagnosis without evidence.

**Evidence / notes:**

---

# 19. CI/CD & Repository Security

- [ ] Production branch protection strategy exists.
- [ ] CI build/typecheck from clean checkout.
- [ ] CI secrets not committed.
- [ ] Fork PR workflows cannot exfiltrate secrets.
- [ ] GitHub Actions least privilege.
- [ ] Third-party Actions pinned/reviewed.
- [ ] Deployment credentials minimal scope.
- [ ] Production deploy intentionally approved/triggered.
- [ ] Artifact maps to commit SHA.
- [ ] Failed security gates can block release.
- [ ] `.env`, `node_modules`, reports, artifacts, signing material ignored.

**Evidence / notes:**

---

# 20. Logging, Monitoring & Incident Response

- [ ] Auth failures monitorable.
- [ ] Rate-limit abuse monitorable.
- [ ] Payment webhook failures monitorable.
- [ ] Entitlement changes auditable.
- [ ] Request/correlation IDs where practical.
- [ ] Sensitive logs access-controlled.
- [ ] Critical backend alerts exist.
- [ ] Security advisory ownership/process exists.
- [ ] Secret compromise response documented.
- [ ] Key rotation procedure documented.
- [ ] Data-breach responsibilities documented.

**Evidence / notes:**

---

# 21. Cure Your Life+ Assessment Safety

- [ ] Assessment remains explicitly non-diagnostic.
- [ ] No content claims emotional patterns cause physical disease.
- [ ] Somatic/body content remains observational/noncausal.
- [ ] Body maps remain metaphorical where applicable.
- [ ] Chakra references remain symbolic, not medical claims.
- [ ] No TCM/Qi/meridian medical causation introduced.
- [ ] Substance use is not presented as excusing abuse.
- [ ] Leaving unsafe situations may be presented as adaptive.
- [ ] Quiz is not presented as clinically validated unless actual validation exists.
- [ ] Free/Pro gating cannot remove safety language.
- [ ] AI wellness output cannot silently become diagnosis/prescription.
- [ ] Crisis/urgent-risk behavior is separated from ordinary self-reflection where applicable.

**Evidence / notes:**

---

# 22. AI Builder Self-Audit

Before accepting any security-sensitive AI change:
- [ ] Actual diff inspected.
- [ ] Trust boundary identified.
- [ ] Attacker-controlled values identified.
- [ ] Authorization enforced outside client.
- [ ] Runtime validation exists.
- [ ] Negative/unauthorized case tested.
- [ ] SDK/API behavior verified.
- [ ] No invented dependency.
- [ ] No insecure fallback added.
- [ ] No test/dev hook leaked into production.
- [ ] TLS verification not disabled.
- [ ] Secret not exposed through env.
- [ ] CORS/RLS not broadened just to “make it work.”
- [ ] Exceptions not silently swallowed.
- [ ] Client premium/admin flags not trusted.
- [ ] AI/tool privileges minimized.
- [ ] Generated test can actually fail.
- [ ] Clean-build behavior verified.
- [ ] Change small enough to understand.
- [ ] Builder can explain exactly why it is safe.

**Evidence / notes:**

---

# 23. Required Adversarial Test Matrix

## Authentication
- [ ] No token
- [ ] Invalid token
- [ ] Expired token
- [ ] Other user's token
- [ ] Deleted/disabled account
- [ ] Logout followed by back navigation

## Authorization
- [ ] User A reads User B
- [ ] User A updates User B
- [ ] User A deletes User B
- [ ] User A assigns ownership to User B
- [ ] Anonymous reads private resource
- [ ] Free user invokes Pro-only sensitive operation

## Input
- [ ] empty
- [ ] null
- [ ] wrong type
- [ ] very long string
- [ ] Unicode edge cases
- [ ] HTML/script
- [ ] SQL metacharacters
- [ ] shell metacharacters
- [ ] path traversal
- [ ] malformed URL
- [ ] private/internal URL
- [ ] unexpected JSON fields

## Payments
- [ ] forged Pro flag
- [ ] invalid Stripe event
- [ ] replayed Stripe event
- [ ] duplicate webhook
- [ ] cancelled subscription
- [ ] expired subscription
- [ ] refunded/revoked purchase
- [ ] Google token from wrong account
- [ ] pending purchase
- [ ] entitlement refresh network failure

## Storage / Switching
- [ ] anonymous → User A
- [ ] User A → sign out
- [ ] User A → User B
- [ ] User B → User A
- [ ] corrupted localStorage
- [ ] expired saved session
- [ ] storage unavailable
- [ ] clear owner while another owner has saved state

**Evidence / notes:**

---

# 24. Release-Blocking Gate

## CRITICAL
- [ ] No exposed production secrets.
- [ ] No Supabase service-role key in client.
- [ ] No unauthenticated private-data exposure.
- [ ] No User A → User B private-data access.
- [ ] No client-spoofable authoritative premium entitlement.
- [ ] No unverified payment path granting Pro.
- [ ] No known SQL/command/RCE path.
- [ ] No production auth bypass/test hook.
- [ ] No critical exploitable dependency vulnerability.
- [ ] Production database/project intentionally selected.

## HIGH
- [ ] RLS reviewed on every private exposed Supabase table.
- [ ] Storage bucket policies reviewed.
- [ ] Sensitive API endpoints authenticate + authorize.
- [ ] Public expensive endpoints have abuse protection.
- [ ] Stripe webhook signature verification confirmed if Stripe live.
- [ ] Google Play purchase verification complete before Android Pro sales.
- [ ] Account deletion/privacy obligations implemented as required.
- [ ] Privacy Policy matches actual data behavior.
- [ ] Clean-checkout build/typecheck/security validators pass.

---

# 25. Final Builder Sign-Off

## Security status
- [ ] **PASS — Ready for controlled beta**
- [ ] **CONDITIONAL PASS — only documented non-blocking findings remain**
- [ ] **FAIL — release blockers remain**

**Critical findings:** `0 / ___`  
**High findings:** `0 / ___`  
**Medium findings:** `0 / ___`  
**Low findings:** `0 / ___`  
**Informational:** `0 / ___`

## Required before beta
- [ ] Item 1:
- [ ] Item 2:
- [ ] Item 3:
- [ ] Item 4:
- [ ] Item 5:

## Required before Play Store release
- [ ] Item 1:
- [ ] Item 2:
- [ ] Item 3:
- [ ] Item 4:
- [ ] Item 5:

## Deferred
- [ ] Item 1:
- [ ] Item 2:
- [ ] Item 3:

## Verification metadata
- Audit date:
- Git branch:
- Git commit:
- Production environment checked:
- Supabase project checked:
- Android package ID checked:
- Builder/agent:
- Reviewer:

---

# 26. Evidence Appendix

## Repository secret scan
```text
PASTE RESULTS HERE
```

## Supabase tables / RLS
```text
PASTE RESULTS HERE
```

## Supabase Security Advisor
```text
PASTE RESULTS HERE
```

## API endpoint inventory
```text
PASTE RESULTS HERE
```

## Dependency audit
```text
PASTE RESULTS HERE
```

## Payment / entitlement architecture
```text
PASTE RESULTS HERE
```

## Android / Google Play status
```text
PASTE RESULTS HERE
```

## Open security findings
```text
PASTE RESULTS HERE
```

---

# Non-Negotiable Rule for AI Builders

> **Never check a security box because the code merely contains the right-looking keyword.**

- `auth.uid()` somewhere does not prove RLS is correct.
- A hidden Pro button does not prove entitlement security.
- A TypeScript type does not validate hostile runtime input.
- `try/catch` does not prove safe error handling.
- A test file does not prove the test exercises the feature.
- A UUID does not authorize access.
- Base64 is not encryption.
- CORS is not authentication.
- Client-side validation is not server-side validation.
- An AI comment saying “sanitize input” is not sanitization.
- A successful build proves only that the computer tolerated the code.

**Evidence beats appearance. Negative tests beat assumptions. Server/database enforcement beats client trust.**
