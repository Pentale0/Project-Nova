import { AuthPage } from "@/components/ui/auth-page";

/**
 * Standalone host for the auth page.
 *
 * Nova is a local-first app with no accounts and no router, so this is mounted
 * at its own path (see src/main.tsx) rather than as a tab. That keeps the
 * component reachable for review without implying a login gate that doesn't
 * exist, and without pulling in react-router for a single screen.
 */
export default function DemoOne() {
  return <AuthPage />;
}
