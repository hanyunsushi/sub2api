import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import AppHeader from "../AppHeader.vue";
import buzzBalanceAPI from "@/api/admin/buzzBalance";

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

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({
    name: "Dashboard",
    params: {},
    meta: { title: "Dashboard", description: "" },
  }),
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

    expect(wrapper.get('[data-testid="header-balance-chip"]').text()).toContain("$42.50");

    await vi.advanceTimersByTimeAsync(7000);
    await nextTick();

    const chip = wrapper.get('[data-testid="header-balance-chip"]');
    expect(chip.text()).toContain("Buzz");
    expect(chip.text()).toContain("$87.66");
    expect(chip.classes().join(" ")).toContain("bg-yellow");
  });

  it("shows both balances in a display-only hover dropdown", async () => {
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
    expect(dropdown.find("a").exists()).toBe(false);
    expect(dropdown.find("button").exists()).toBe(false);
  });
});
