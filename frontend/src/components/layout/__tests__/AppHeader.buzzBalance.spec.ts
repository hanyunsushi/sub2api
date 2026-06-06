import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import AppHeader from "../AppHeader.vue";
import buzzBalanceAPI from "@/api/admin/buzzBalance";
import qlhazycoderSubscriptionAPI from "@/api/admin/qlhazycoderSubscription";
import tcdmxSubscriptionAPI from "@/api/admin/tcdmxSubscription";
import xhyapiSubscriptionAPI from "@/api/admin/xhyapiSubscription";

const authState = vi.hoisted(() => ({
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

vi.mock("@/api/admin/buzzBalance", () => ({
  default: {
    getBalance: vi.fn(),
  },
}));

vi.mock("@/api/admin/tcdmxSubscription", () => ({
  default: {
    getStatus: vi.fn(),
  },
}));

vi.mock("@/api/admin/qlhazycoderSubscription", () => ({
  default: {
    getStatus: vi.fn(),
  },
}));

vi.mock("@/api/admin/xhyapiSubscription", () => ({
  default: {
    getStatus: vi.fn(),
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

describe("AppHeader BuzzAI balance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    authState.user = {
      id: 1,
      username: "admin",
      email: "admin@example.com",
      role: "admin",
      balance: 42.5,
    };
    authState.isAdmin = true;
    vi.mocked(buzzBalanceAPI.getBalance).mockResolvedValue({
      enabled: true,
      configured: true,
      currency: "USD",
      total: 100,
      used: 12.34,
      remaining: 87.66,
      site_url: "https://buzzai.cc/dashboard/billing",
      expires_at: "2026-06-30T00:00:00Z",
      refreshed_at: "2026-05-21T10:00:00Z",
    });
    vi.mocked(tcdmxSubscriptionAPI.getStatus).mockResolvedValue({
      provider: "tcdmx",
      enabled: true,
      configured: true,
      currency: "USD",
      site_url: "https://tcdmx.com/subscriptions",
      total_limit_usd: 100,
      used_usd: 12.25,
      remaining_usd: 87.75,
      expires_at: "2026-07-08T00:00:00Z",
      active_count: 1,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    });
    vi.mocked(qlhazycoderSubscriptionAPI.getStatus).mockResolvedValue({
      provider: "qlhazycoder",
      enabled: true,
      configured: true,
      currency: "CNY",
      site_url: "https://api.qlhazycoder.top",
      used_usd: 48.75,
      remaining_usd: 101.25,
      active_count: 1,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    });
    vi.mocked(xhyapiSubscriptionAPI.getStatus).mockResolvedValue({
      provider: "xhyapi",
      enabled: true,
      configured: true,
      currency: "USD",
      site_url: "https://xhyapi.com",
      total_limit_usd: 80,
      used_usd: 13.5,
      remaining_usd: 66.5,
      expires_at: "2026-08-09T00:00:00Z",
      active_count: 1,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    });
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
    expect(chip.text()).toContain("XHY");
    expect(chip.text()).toContain("$66.50");
    expect(chip.classes().join(" ")).toContain("balance-chip-xhyapi");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("$42.50");
    expect(chip.text()).not.toContain("Buzz");
    expect(chip.classes().join(" ")).toContain("balance-chip-system");
  });

  it("shows system, BuzzAI, TCDMX, qlhazycoder, and XHYAPI balances in a display-only hover dropdown", async () => {
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
    expect(dropdown.text()).toContain("XHY");
    expect(dropdown.text()).toContain("$66.50");
    expect(dropdown.text()).toContain("2026-08-09");
    expect(dropdown.find("a").exists()).toBe(false);
    expect(dropdown.find("button").exists()).toBe(false);
  });

  it("shows long-term when an external quota expiry is not returned", async () => {
    vi.mocked(tcdmxSubscriptionAPI.getStatus).mockResolvedValueOnce({
      provider: "tcdmx",
      enabled: true,
      configured: true,
      currency: "USD",
      site_url: "https://tcdmx.com/subscriptions",
      total_limit_usd: 100,
      used_usd: 12.25,
      remaining_usd: 87.75,
      active_count: 1,
      subscriptions: [],
      refreshed_at: "2026-05-21T10:00:00Z",
    });

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
    vi.mocked(tcdmxSubscriptionAPI.getStatus).mockResolvedValueOnce({
      provider: "tcdmx",
      enabled: true,
      configured: true,
      currency: "USD",
      site_url: "https://tcdmx.com",
      used_usd: 0,
      active_count: 0,
      subscriptions: [],
      error_code: "INVALID_TOKEN",
      error_message: "Invalid token",
      refreshed_at: "2026-05-21T10:00:00Z",
    });

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
    vi.mocked(qlhazycoderSubscriptionAPI.getStatus).mockResolvedValueOnce({
      provider: "qlhazycoder",
      enabled: true,
      configured: true,
      currency: "CNY",
      site_url: "https://api.qlhazycoder.top",
      used_usd: 0,
      active_count: 0,
      subscriptions: [],
      error_code: "401",
      error_message: "缺少 Authorization header",
      refreshed_at: "2026-05-21T10:00:00Z",
    });

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
    vi.mocked(xhyapiSubscriptionAPI.getStatus).mockResolvedValueOnce({
      provider: "xhyapi",
      enabled: true,
      configured: true,
      currency: "USD",
      site_url: "https://xhyapi.com",
      used_usd: 0,
      active_count: 0,
      subscriptions: [],
      error_code: "401",
      error_message: "Authorization header is required",
      refreshed_at: "2026-05-21T10:00:00Z",
    });

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
});
