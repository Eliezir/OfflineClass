import { createFileRoute } from '@tanstack/react-router'
import { OnboardingFlow } from '@renderer/modules/onboarding/components/onboarding-flow'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingRoute
})

function OnboardingRoute(): React.JSX.Element {
  return <OnboardingFlow />
}
