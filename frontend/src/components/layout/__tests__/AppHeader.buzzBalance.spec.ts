import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import AppHeader from "../AppHeader.vue";
import externalSubscriptionsAPI, { type ExternalSubscriptionStatus } from "@/api/admin/externalSubscriptions";

const authState = vi.hoisted(() => ({
  nextUserId: 1,
  user: {
    id: 1,
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    balance: 42.5,
  },
  isAdmin: true,
  isSimpleMode: false,
  logout: vi.fn(),
}));

vi.mock("@/api/admin/externalSubscriptions", () => ({
  default: {
    getStatuses: vi.fn(),
    getDisplayStatuses: vi.fn(),
    subscribeDisplayStatuses: vi.fn(() => vi.fn()),
  },
}));

vi.mock("@/stores", () => ({
  useAuthStore: () => ({
    get user() {
      return authState.user;
    },
    get isAdmin() {
      return authState.isAdmin;
    },
    get isSimpleMode() {
      return authState.isSimpleMode;
    },
    logout: authState.logout,
  }),
  useAppStore: () => ({
    contactInfo: "",
    docUrl: "",
    cachedPublicSettings: { custom_menu_items: [] },
    toggleMobileSidebar: vi.fn(),
  }),
  useOnboardingStore: () => ({
    replay: vi.fn(),
  }),
}));

vi.mock("@/stores/adminSettings", () => ({
  useAdminSettingsStore: () => ({
    customMenuItems: [],
  }),
}));

const routeState = vi.hoisted(() => ({
  path: "/admin/ops",
  name: "Ops",
  params: {},
  meta: { title: "运维监控", description: "请求与系统运行状态" },
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => routeState,
  RouterLink: {
    props: ["to"],
    template: "<a><slot /></a>",
  },
}));

vi.mock("vue-i18n", async () => {
  const actual = await vi.importActual<typeof import("vue-i18n")>("vue-i18n");
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
    }),
  };
});

function defaultExternalStatuses(
  overrides: Record<string, Partial<ExternalSubscriptionStatus>> = {},
): ExternalSubscriptionStatus[] {
  const items: ExternalSubscriptionStatus[] = [
    {
      provider: "buzz",
      name: "Buzz",
      template: "buzz_balance",
      enabled: true,
      configured: true,
      api_token_configured: true,
      refresh_token_configured: false,
      match_keywords: ["buzz", "buzzai", "buzzai.cc", "claude"],
      sort_order: 5,
      currency: "USD",
      site_url: "https://buzzai.cc/dashboard/billing",
      total_limit_usd: 100,
      used_usd: 12.34,
      remaining_usd: 87.66,
      expires_at: "2026-06-30T00:00:00Z",
      active_count: 1,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    },
    {
      provider: "tcdmx",
      name: "TCDMX",
      template: "active_subscriptions",
      enabled: true,
      configured: true,
      api_token_configured: true,
      refresh_token_configured: false,
      match_keywords: ["tcdmx", "tcdmx.com"],
      sort_order: 10,
      currency: "USD",
      site_url: "https://tcdmx.com/subscriptions",
      total_limit_usd: 100,
      used_usd: 12.25,
      remaining_usd: 87.75,
      expires_at: "2026-07-08T00:00:00Z",
      active_count: 1,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    },
    {
      provider: "qlhazycoder",
      name: "qlhazycoder",
      template: "newapi_console",
      enabled: true,
      configured: true,
      api_token_configured: true,
      refresh_token_configured: false,
      match_keywords: ["qlhazycoder", "qlhazy"],
      sort_order: 20,
      currency: "CNY",
      site_url: "https://api.qlhazycoder.top",
      used_usd: 48.75,
      remaining_usd: 101.25,
      active_count: 1,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    },
    {
      provider: "packycode",
      name: "PackyCode",
      template: "newapi_console",
      enabled: true,
      configured: true,
      api_token_configured: true,
      refresh_token_configured: false,
      match_keywords: ["packycode", "packy"],
      sort_order: 30,
      currency: "CNY",
      site_url: "https://www.packyapi.com",
      total_limit_usd: 120,
      used_usd: 31.2,
      remaining_usd: 88.8,
      expires_at: "2026-11-12T00:00:00Z",
      active_count: 1,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    },
    {
      provider: "xhyapi",
      name: "XHYAPI",
      template: "active_subscriptions",
      enabled: true,
      configured: true,
      api_token_configured: true,
      refresh_token_configured: false,
      match_keywords: ["xhyapi", "xhy"],
      sort_order: 40,
      currency: "USD",
      site_url: "https://xhyapi.com",
      total_limit_usd: 80,
      used_usd: 13.5,
      remaining_usd: 66.5,
      expires_at: "2026-08-09T00:00:00Z",
      active_count: 1,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    },
    {
      provider: "pixel",
      name: "Pixel",
      template: "active_subscriptions",
      enabled: true,
      configured: true,
      api_token_configured: true,
      refresh_token_configured: false,
      match_keywords: ["pixel", "ai-pixel.online"],
      sort_order: 50,
      currency: "USD",
      site_url: "https://ai-pixel.online",
      logo_url: "https://cdn.example.com/pixel.png",
      total_limit_usd: 70,
      used_usd: 8.25,
      remaining_usd: 61.75,
      expires_at: "2026-10-11T00:00:00Z",
      active_count: 1,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    },
    {
      provider: "openrouter",
      name: "OpenRouter",
      template: "openrouter_credits",
      enabled: true,
      configured: true,
      api_token_configured: true,
      refresh_token_configured: false,
      match_keywords: ["openrouter"],
      sort_order: 70,
      currency: "USD",
      site_url: "https://openrouter.ai",
      total_limit_usd: 25.5,
      used_usd: 4.25,
      remaining_usd: 21.25,
      active_count: 0,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    },
    {
      provider: "cloudflare",
      name: "Cloudflare AI Gateway",
      template: "cloudflare_ai_gateway_credits",
      enabled: true,
      configured: true,
      api_token_configured: true,
      refresh_token_configured: false,
      match_keywords: ["cloudflare", "ai-gateway"],
      sort_order: 80,
      currency: "USD",
      site_url: "https://api.cloudflare.com/client/v4",
      used_usd: 0,
      remaining_usd: 12.75,
      active_count: 0,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    },
    {
      provider: "liust",
      name: "liust",
      template: "newapi_console",
      enabled: true,
      configured: true,
      api_token_configured: true,
      refresh_token_configured: false,
      match_keywords: ["liust"],
      sort_order: 60,
      currency: "USD",
      site_url: "https://liust.xyz",
      total_limit_usd: 90,
      used_usd: 14.25,
      remaining_usd: 75.75,
      expires_at: "2026-09-10T00:00:00Z",
      active_count: 1,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    },
  ];

  return items.map((item) => ({ ...item, ...(overrides[item.provider] ?? {}) }));
}

describe("AppHeader BuzzAI balance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    authState.user = {
      id: authState.nextUserId++,
      username: "admin",
      email: "admin@example.com",
      role: "admin",
      balance: 42.5,
    };
    authState.isAdmin = true;
    vi.mocked(externalSubscriptionsAPI.getDisplayStatuses).mockResolvedValue(defaultExternalStatuses());
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  function mountHeader() {
    return mount(AppHeader, {
      attachTo: document.body,
      global: {
        stubs: {
          Icon: { template: "<span />" },
          LocaleSwitcher: { template: "<div />" },
          SubscriptionProgressMini: { template: "<div />" },
          AnnouncementBell: { template: "<div />" },
          FloatingDropdown: {
            props: ["show", "triggerEl", "panelClass"],
            template:
              '<div v-if="show" class="floating-dropdown-portal" :class="panelClass"><slot /></div>',
          },
          RouterLink: { template: "<a><slot /></a>" },
        },
      },
    });
  }

  it("rotates the top-right balance chip to BuzzAI every 7 seconds", async () => {
    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    let chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("$42.50");
    expect(chip.text()).not.toContain("Buzz");
    expect(chip.classes().join(" ")).toContain("balance-chip-system");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("Buzz");
    expect(chip.text()).toContain("$87.66");
    expect(chip.text()).not.toContain("$42.50");
    expect(chip.classes().join(" ")).toContain("balance-chip-buzz");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("TCDMX");
    expect(chip.text()).toContain("$87.75");
    expect(chip.text()).not.toContain("/ $100.00");
    expect(chip.classes().join(" ")).toContain("balance-chip-tcdmx");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("QL");
    expect(chip.text()).toContain("¥101.25");
    expect(chip.classes().join(" ")).toContain("balance-chip-qlhazycoder");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("Packy");
    expect(chip.text()).toContain("¥88.80");
    expect(chip.classes().join(" ")).toContain("balance-chip-packycode");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("XHY");
    expect(chip.text()).toContain("$66.50");
    expect(chip.classes().join(" ")).toContain("balance-chip-xhyapi");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("Pixel");
    expect(chip.text()).toContain("$61.75");
    expect(chip.classes().join(" ")).toContain("balance-chip-pixel");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("OpenRouter");
    expect(chip.text()).toContain("$21.25");
    expect(chip.classes().join(" ")).toContain("balance-chip-openrouter");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("Cloudflare");
    expect(chip.text()).toContain("$12.75");
    expect(chip.classes().join(" ")).toContain("balance-chip-cloudflare");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("LIUST");
    expect(chip.text()).toContain("$75.75");
    expect(chip.classes().join(" ")).toContain("balance-chip-liust");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("$42.50");
    expect(chip.text()).not.toContain("Buzz");
    expect(chip.classes().join(" ")).toContain("balance-chip-system");
  });

  it("shows system, BuzzAI, TCDMX, qlhazycoder, PackyCode, XHYAPI, Pixel, OpenRouter, Cloudflare, and liust balances in a display-only hover dropdown", async () => {
    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    await wrapper.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();

    const dropdown = wrapper.get('[data-testid="header-balance-dropdown"]');
    expect(dropdown.text()).toContain("系统余额");
    expect(dropdown.text()).toContain("$42.50");
    expect(dropdown.text()).toContain("Buzz");
    expect(dropdown.text()).toContain("$87.66");
    expect(dropdown.text()).toContain("TCDMX");
    expect(dropdown.text()).toContain("$87.75");
    expect(dropdown.text()).not.toContain("/ $100.00");
    expect(dropdown.text()).toContain("2026-07-08");
    expect(dropdown.text()).toContain("QL");
    expect(dropdown.text()).toContain("¥101.25");
    expect(dropdown.text()).toContain("长期");
    expect(dropdown.text()).toContain("Packy");
    expect(dropdown.text()).toContain("¥88.80");
    expect(dropdown.text()).toContain("2026-11-12");
    expect(dropdown.text()).toContain("XHY");
    expect(dropdown.text()).toContain("$66.50");
    expect(dropdown.text()).toContain("2026-08-09");
    expect(dropdown.text()).toContain("Pixel");
    expect(dropdown.text()).toContain("$61.75");
    expect(dropdown.text()).toContain("2026-10-11");
    expect(dropdown.text()).toContain("OpenRouter");
    expect(dropdown.text()).toContain("$21.25");
    expect(dropdown.text()).toContain("Cloudflare");
    expect(dropdown.text()).toContain("$12.75");
    expect(dropdown.text()).toContain("LIUST");
    expect(dropdown.text()).toContain("$75.75");
    expect(dropdown.text()).toContain("2026-09-10");
    expect(dropdown.find("a").exists()).toBe(false);
    expect(dropdown.find("button").exists()).toBe(false);
  });

  it("shows long-term when an external quota expiry is not returned", async () => {
    vi.mocked(externalSubscriptionsAPI.getDisplayStatuses).mockResolvedValueOnce(defaultExternalStatuses({
      tcdmx: { expires_at: undefined },
    }));

    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    await wrapper.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();

    const dropdown = wrapper.get('[data-testid="header-balance-dropdown"]');
    expect(dropdown.text()).toContain("TCDMX");
    expect(dropdown.text()).toContain("长期");
    expect(dropdown.text()).not.toContain("期限未返回");
  });

  it("keeps TCDMX visible when the saved subscription token is invalid", async () => {
    vi.mocked(externalSubscriptionsAPI.getDisplayStatuses).mockResolvedValueOnce(defaultExternalStatuses({
      tcdmx: {
        site_url: "https://tcdmx.com",
        used_usd: 0,
        remaining_usd: undefined,
        total_limit_usd: undefined,
        active_count: 0,
        error_code: "INVALID_TOKEN",
        error_message: "Invalid token",
      },
    }));

    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    await wrapper.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();

    const dropdown = wrapper.get('[data-testid="header-balance-dropdown"]');
    expect(dropdown.text()).toContain("TCDMX");
    expect(dropdown.text()).toContain("Token 失效");
    expect(dropdown.text()).toContain("请更新 Token");
  });

  it("shows qlhazycoder web login token failures as token expiry", async () => {
    vi.mocked(externalSubscriptionsAPI.getDisplayStatuses).mockResolvedValueOnce(defaultExternalStatuses({
      qlhazycoder: {
        used_usd: 0,
        remaining_usd: undefined,
        total_limit_usd: undefined,
        active_count: 0,
        error_code: "401",
        error_message: "缺少 Authorization header",
      },
    }));

    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    await wrapper.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();

    const dropdown = wrapper.get('[data-testid="header-balance-dropdown"]');
    expect(dropdown.text()).toContain("QL");
    expect(dropdown.text()).toContain("Token 失效");
    expect(dropdown.text()).toContain("请更新 Token");
  });

  it("shows XHYAPI web login token failures as token expiry", async () => {
    vi.mocked(externalSubscriptionsAPI.getDisplayStatuses).mockResolvedValueOnce(defaultExternalStatuses({
      xhyapi: {
        used_usd: 0,
        remaining_usd: undefined,
        total_limit_usd: undefined,
        active_count: 0,
        error_code: "401",
        error_message: "Authorization header is required",
      },
    }));

    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    await wrapper.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();

    const dropdown = wrapper.get('[data-testid="header-balance-dropdown"]');
    expect(dropdown.text()).toContain("XHY");
    expect(dropdown.text()).toContain("Token 失效");
    expect(dropdown.text()).toContain("请更新 Token");
  });

  it("shows Pixel subscription token failures as token expiry", async () => {
    vi.mocked(externalSubscriptionsAPI.getDisplayStatuses).mockResolvedValueOnce(defaultExternalStatuses({
      pixel: {
        used_usd: 0,
        remaining_usd: undefined,
        total_limit_usd: undefined,
        active_count: 0,
        error_code: "INVALID_TOKEN",
        error_message: "Invalid token",
      },
    }));

    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    await wrapper.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();

    const dropdown = wrapper.get('[data-testid="header-balance-dropdown"]');
    expect(dropdown.text()).toContain("Pixel");
    expect(dropdown.text()).toContain("Token 失效");
    expect(dropdown.text()).toContain("请更新 Token");
  });

  it("renders the active external subscription logo in the top-right balance chip", async () => {
    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    await vi.advanceTimersByTimeAsync(42_000);
    await nextTick();

    const chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("Pixel");
    const logo = chip.get('[data-testid="header-balance-provider-logo"]');
    expect(logo.attributes("data-logo-url")).toBe("https://cdn.example.com/pixel.png");
  });

  it("renders external subscription logos in the balance dropdown rows", async () => {
    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    await wrapper.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();

    const dropdown = wrapper.get('[data-testid="header-balance-dropdown"]');
    const logos = dropdown.findAll('[data-testid="header-balance-dropdown-provider-logo"]');
    expect(logos.length).toBeGreaterThan(0);
    expect(logos.some((logo) => logo.attributes("data-logo-url") === "https://cdn.example.com/pixel.png")).toBe(true);
  });

  it("keeps the console route context visible in the header", async () => {
    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    const contextStrip = wrapper.get('[data-testid="header-context-strip"]');
    expect(contextStrip.text()).toContain("运维监控");
    expect(contextStrip.text()).toContain("ADMIN");
    expect(contextStrip.text()).toContain("CONSOLE / OPS");
    expect(contextStrip.text()).not.toContain("$42.50");
    expect(contextStrip.text()).not.toContain("$87.66");
    expect(contextStrip.text()).not.toContain("SYS");
    expect(contextStrip.text()).not.toContain("Buzz");
  });

  it("uses the shared display-status API across header remounts", async () => {
    const first = mountHeader();
    await nextTick();
    await Promise.resolve();
    await Promise.resolve();
    await nextTick();

    expect(externalSubscriptionsAPI.getDisplayStatuses).toHaveBeenCalledTimes(1);
    await first.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();
    expect(first.get('[data-testid="header-balance-dropdown"]').text()).toContain("OpenRouter");
    first.unmount();

    const second = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(externalSubscriptionsAPI.getDisplayStatuses).toHaveBeenCalledTimes(2);
    await second.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();
    expect(second.get('[data-testid="header-balance-dropdown"]').text()).toContain("OpenRouter");
  });

  it("does not call a separate Buzz balance API because Buzz is part of display statuses", async () => {
    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    await wrapper.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();

    expect(externalSubscriptionsAPI.getDisplayStatuses).toHaveBeenCalledTimes(1);
    expect(wrapper.get('[data-testid="header-balance-dropdown"]').text()).toContain("Buzz");
  });

  it("keeps the last visible external balances when a later refresh fails", async () => {
    const wrapper = mountHeader();
    await nextTick();
    await Promise.resolve();
    await Promise.resolve();
    await nextTick();

    await wrapper.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();
    expect(wrapper.get('[data-testid="header-balance-dropdown"]').text()).toContain("OpenRouter");

    vi.mocked(externalSubscriptionsAPI.getDisplayStatuses).mockRejectedValueOnce(new Error("temporary outage"));
    authState.user = {
      id: authState.nextUserId++,
      username: "admin",
      email: "admin@example.com",
      role: "admin",
      balance: 42.5,
    };
    await nextTick();
    await Promise.resolve();
    await nextTick();

    await wrapper.get('[data-testid="header-balance-chip"]').trigger("mouseenter");
    await nextTick();
    expect(wrapper.get('[data-testid="header-balance-dropdown"]').text()).toContain("OpenRouter");
    expect(wrapper.get('[data-testid="header-balance-dropdown"]').text()).toContain("$21.25");
  });
});
