/** 新手引导已按产品要求永久停用；保留原业务表单调用接口，禁止注册、重放或产生DOM/监听。 */
export interface OnboardingOptions { storageKey?: string; autoStart?: boolean }
export function useOnboardingTour(_options: OnboardingOptions = {}) {
  const noop = () => {}
  const asyncNoop = async () => {}
  return { startTour: asyncNoop, replayTour: noop, nextStep: async (_delay?: number) => {},
    isCurrentStep: (_selector: string) => false, hasSeen: () => true, markAsSeen: noop, clearSeen: noop }
}
