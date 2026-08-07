// Fail-closed environment predicates for premium authorization and server mode.
//
// Production premium authorization MUST fail closed: an unset, missing, or
// unexpected environment value must NEVER grant Pro access.
//
// The development premium bypass requires BOTH:
//   - NODE_ENV === "development"
//   - DEV_PREMIUM === "true"   (exact lowercase literal; no truthy coercion)
//
// Every other combination yields false.

export const isDevelopmentEnvironment = (
  nodeEnv: string | undefined,
): boolean => nodeEnv === "development";

export const isDevelopmentPremiumEnabled = (
  nodeEnv: string | undefined,
  devPremium: string | undefined,
): boolean =>
  isDevelopmentEnvironment(nodeEnv) && devPremium === "true";

// Production/static serving is the default for every mode that is not an
// explicit development environment. Absent NODE_ENV must never start the Vite
// dev middleware.
export const isProductionServingMode = (
  nodeEnv: string | undefined,
): boolean => !isDevelopmentEnvironment(nodeEnv);