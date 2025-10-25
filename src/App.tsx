import { useEffect, useMemo, useState } from "react";
import {
  Aperture,
  CalendarRange,
  Coins,
  LayoutDashboard,
  Settings2,
  Sparkles,
  AppWindow,
  Menu,
  X
} from "lucide-react";
import { useHydratedFocusStore, useFocusStore } from "@/state/useFocusStore";
import DashboardView from "@/features/dashboard/DashboardView";
import PlannerView from "@/features/planner/PlannerView";
import HabitsView from "@/features/habits/HabitsView";
import CoinsView from "@/features/coins/CoinsView";
import WidgetView from "@/features/dashboard/WidgetView";
import LogoMark from "@/components/LogoMark";
import { getTodayKey } from "@/utils/date";
import type { ThemeId } from "@/state/types";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "planner", label: "Rejalash", icon: CalendarRange },
  { id: "habits", label: "Odatlar", icon: Aperture },
  { id: "coins", label: "Coinlar", icon: Coins },
  { id: "settings", label: "Sozlamalar", icon: Settings2 }
] as const;

const themeOptions: Array<{ id: ThemeId; label: string; description: string; swatch: [string, string]; glow: string }> = [
  {
    id: "ocean",
    label: "Ocean Pulse",
    description: "Ko'k gradientlar va sokin neon effektlar.",
    swatch: ["#3566ff", "#38bdf8"],
    glow: "from-primary-500/30 to-cyan-400/30"
  },
  {
    id: "sunset",
    label: "Sunset Flow",
    description: "Issiq to'q sariq va pushti soyalar.",
    swatch: ["#ff6b3c", "#ffbe6e"],
    glow: "from-[#ff6b3c]/40 to-[#f59e0b]/30"
  },
  {
    id: "aurora",
    label: "Aurora Breeze",
    description: "Sovuq moviy va binafsha chiziqlar.",
    swatch: ["#3aa2ff", "#c084fc"],
    glow: "from-[#22d3ee]/30 to-[#c084fc]/30"
  },
  {
    id: "midnight",
    label: "Midnight Drive",
    description: "Kechki tun va to'q binafsha yorqinligi.",
    swatch: ["#5c4bff", "#1f1861"],
    glow: "from-[#5c4bff]/30 to-[#6366f1]/25"
  }
];

const inferTabFromHash = (): (typeof tabs)[number]["id"] => {
  const hash = window.location.hash.replace("#/", "");
  if (hash === "widget") return "dashboard";
  return (tabs.find(tab => tab.id === hash)?.id ?? "dashboard") as (typeof tabs)[number]["id"];
};

const AppShell = () => {
  const weekMeta = useFocusStore(state => state.weekMeta);
  const coinBank = useFocusStore(state => state.coinBank);
  const notificationsEnabled = useFocusStore(state => state.notificationsEnabled);
  const pendingLogs = useFocusStore(state => state.dailyLogs[getTodayKey()]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>(inferTabFromHash);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasWidgetSupport =
    typeof window !== "undefined" && Boolean(window.focusFlowAPI?.toggleWidget);

  useEffect(() => {
    const handler = () => {
      setActiveTab(inferTabFromHash());
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const handleTabChange = (tabId: (typeof tabs)[number]["id"]) => {
    setActiveTab(tabId);
    window.location.hash = `#/${tabId}`;
    setSidebarOpen(false);
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  const editsLeft = useMemo(() => Math.max(0, 3 - (weekMeta?.editsUsed ?? 0)), [weekMeta]);
  const isEvening = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 19;
  }, [pendingLogs?.updatedAt]);

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground md:h-screen md:flex-row">
      <div className="pointer-events-none absolute inset-0 blur-3xl" aria-hidden>
        <div className="absolute left-[-10%] top-[-20%] h-96 w-96 rounded-full bg-primary-500/20" />
        <div className="absolute right-[-15%] top-1/4 h-[420px] w-[420px] rounded-full bg-[#ff6b6b]/20" />
        <div className="absolute bottom-[-30%] left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#22d3ee]/10" />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-white/10 bg-surface/95 backdrop-blur-xl transition-transform duration-300 ease-in-out md:relative md:z-10 md:w-72 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-1 shadow-glow ring-1 ring-white/5">
              <LogoMark size={48} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-wide">Focus Flow</h1>
              <p className="text-xs text-white/60">Ultra fokus haftalik ritual</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 md:hidden"
            aria-label="Menuni yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2 px-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                  active
                    ? "bg-primary-500/20 text-white shadow-glow"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-primary-200" : "text-white/50"}`} />
                <div>
                  <div className="text-sm font-medium">{tab.label}</div>
                  {tab.id === "planner" && (
                    <div className="text-xs text-white/50">Qoldi {editsLeft} tahrir</div>
                  )}
                  {tab.id === "settings" && (
                    <div className="text-xs text-white/50">
                      Bildirishnoma {notificationsEnabled ? "yoqilgan" : "o'chirilgan"}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 px-6 pb-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Hozirgi coinlar</div>
            <div className="mt-1 flex items-baseline gap-2 text-3xl font-semibold">
              <span>{coinBank}</span>
              <span className="text-sm text-white/50">Coin</span>
            </div>
            <p className="mt-3 text-xs text-white/50">
              Hamma mukofotlar uchun tayyor turibdi. Ko'proq challenge qo'shing!
            </p>
          </div>
          {hasWidgetSupport && (
            <button
              onClick={() => {
                void window.focusFlowAPI?.toggleWidget?.();
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500/80 via-primary-400/70 to-primary-500/80 px-4 py-3 text-sm font-semibold shadow-lg shadow-primary-900/20 transition hover:shadow-primary-500/30"
            >
              <AppWindow className="h-4 w-4" /> Widgetni ochish
            </button>
          )}
        </div>
      </aside>

      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <HeaderSection
          onOpenWidget={() => {
            if (hasWidgetSupport) {
              void window.focusFlowAPI?.toggleWidget?.();
            }
          }}
          hasWidgetSupport={hasWidgetSupport}
          onToggleMenu={() => {
            setSidebarOpen(prev => !prev);
          }}
        />
        <section className="flex-1 overflow-y-auto px-4 pb-10 pt-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 sm:px-6 md:px-8 md:pt-6">
          {activeTab === "dashboard" && <DashboardView onOpenPlanner={() => handleTabChange("planner")} />}
          {activeTab === "planner" && <PlannerView editsLeft={editsLeft} />}
          {activeTab === "habits" && <HabitsView isEvening={isEvening} />}
          {activeTab === "coins" && <CoinsView />}
          {activeTab === "settings" && <SettingsView />}
        </section>
      </main>
    </div>
  );
};

const HeaderSection = ({
  onOpenWidget,
  hasWidgetSupport,
  onToggleMenu
}: {
  onOpenWidget: () => void;
  hasWidgetSupport: boolean;
  onToggleMenu: () => void;
}) => {
  const [clock, setClock] = useState(() => new Date());
  const weekMeta = useFocusStore(state => state.weekMeta);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("uz-UZ", {
        weekday: "long",
        day: "numeric",
        month: "long"
      }),
    []
  );

  return (
    <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 backdrop-blur-xl sm:px-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-5">
      <div className="flex w-full items-start justify-between gap-4 md:items-center">
        <div className="flex items-start gap-3 md:items-center">
          <button
            onClick={onToggleMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20 md:hidden"
            aria-label="Menuni ochish"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.4em] text-white/40 sm:text-sm">
              Current Focus
            </div>
            <div className="mt-2 flex flex-col gap-1 text-white/70 sm:flex-row sm:items-baseline sm:gap-4">
              <div className="text-3xl font-semibold leading-tight sm:text-4xl">
                {clock.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="text-sm text-white/60 sm:text-base">{dayFormatter.format(clock)}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right text-sm">
          <div className="text-xs text-white/50">Haftalik tahrir limiti</div>
          <div className="text-base font-semibold text-white">
            {Math.max(0, 3 - (weekMeta?.editsUsed ?? 0))} / 3 qoldi
          </div>
        </div>
        {hasWidgetSupport && (
          <button
            onClick={onOpenWidget}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Widget
          </button>
        )}
      </div>
    </header>
  );
};

const SettingsView = () => {
  const theme = useFocusStore(state => state.theme);
  const setTheme = useFocusStore(state => state.setTheme);
  const notificationsEnabled = useFocusStore(state => state.notificationsEnabled);
  const toggleNotification = useFocusStore(state => state.toggleNotification);
  const widgetPinned = useFocusStore(state => state.widgetPinned);
  const toggleWidgetPinned = useFocusStore(state => state.toggleWidgetPinned);
  const resetWeekMeta = useFocusStore(state => state.resetWeekMeta);
  const resetAllData = useFocusStore(state => state.resetAllData);
  const hasWidgetSupport =
    typeof window !== "undefined" && Boolean(window.focusFlowAPI?.toggleWidget);
  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);
  const [themeMessage, setThemeMessage] = useState<string | null>(null);
  const [themeLoading, setThemeLoading] = useState<ThemeId | null>(null);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleThemeSelect = async (nextTheme: ThemeId) => {
    if (nextTheme === theme) {
      setThemeMessage("Tanlangan tema allaqachon qo'llanilmoqda.");
      return;
    }
    setThemeMessage(null);
    setThemeLoading(nextTheme);
    await setTheme(nextTheme);
    setThemeLoading(null);
    const selected = themeOptions.find(option => option.id === nextTheme);
    if (selected) {
      setThemeMessage(`${selected.label} temasi faollashtirildi.`);
    }
  };

  const handleNotificationToggle = async (checked: boolean) => {
    setNotificationFeedback(null);
    setNotificationLoading(true);
    const result = await toggleNotification(checked);
    if (!result.success && result.reason) {
      setNotificationFeedback(result.reason);
    } else if (result.success && checked) {
      setNotificationFeedback("Bildirishnomalar faollashtirildi.");
    } else {
      setNotificationFeedback(null);
    }
    setNotificationLoading(false);
  };

  const handleFullReset = async () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Barcha ma'lumotlar, vazifalar, odatlar va coinlar tozalanadi. Davom etasizmi?"
      );
      if (!confirmed) return;
    }
    setResetting(true);
    await resetAllData();
    setResetFeedback("Ma'lumotlar standart holatga qaytarildi.");
    setResetting(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-semibold">Rangli temalar</h2>
        <p className="mt-1 text-sm text-foreground/70">Kayfiyatga mos palitrani tanlang.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {themeOptions.map(option => {
            const active = option.id === theme;
            return (
              <button
                key={option.id}
                onClick={() => {
                  void handleThemeSelect(option.id);
                }}
                disabled={themeLoading !== null && themeLoading !== option.id}
                className={`group relative overflow-hidden rounded-3xl border px-1 py-1 text-left transition focus:outline-none focus:ring-2 focus:ring-primary-400/40 ${
                  active
                    ? "border-primary-400/80 bg-primary-500/10"
                    : "border-white/10 bg-black/20 hover:border-primary-400/50 hover:bg-white/10"
                } ${themeLoading === option.id ? "opacity-80" : ""}`}
                aria-pressed={active}
              >
                <div className="relative rounded-[26px] border border-white/10 bg-surface/80 p-4 backdrop-blur">
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${option.glow} opacity-0 transition group-hover:opacity-90 ${
                      active ? "opacity-90" : ""
                    }`}
                  />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{option.label}</div>
                      <p className="mt-1 text-xs text-foreground/70">{option.description}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/30">
                      <div
                        className="h-8 w-8 rounded-full border border-white/10 shadow-inner"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${option.swatch[0]}, ${option.swatch[1]})`
                        }}
                      />
                    </div>
                  </div>
                  {active && (
                    <span className="relative mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/80">
                      Aktiv
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {themeMessage && (
          <div className="mt-4 rounded-2xl border border-primary-500/40 bg-primary-500/10 px-4 py-3 text-xs text-primary-100">
            {themeMessage}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-semibold">Bildirishnomalar</h2>
        <p className="mt-1 text-sm text-foreground/70">
          Vazifa boshlanishidan 5 daqiqa oldin eslatma olasiz.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/30 p-4">
          <div>
            <div className="text-sm font-semibold">Bildirishnomani {notificationsEnabled ? "o'chirish" : "yoqish"}</div>
            <p className="text-xs text-foreground/60">
              {notificationsEnabled
                ? "AI coach sizga zarur paytda push yuborib turadi."
                : "Bildirishnomalar hozircha o'chirilgan."}
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3">
            <span className="text-sm text-foreground/60">{notificationsEnabled ? "On" : "Off"}</span>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={event => {
                void handleNotificationToggle(event.target.checked);
              }}
              disabled={notificationLoading}
              className="h-5 w-10 appearance-none rounded-full bg-white/10 transition checked:bg-primary-500"
            />
          </label>
        </div>
        {notificationFeedback && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-xs text-foreground/65">
            {notificationFeedback}
          </div>
        )}
      </section>

      {hasWidgetSupport && (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold">Widget sozlamalari</h2>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/30 p-4">
            <div>
              <div className="text-sm font-semibold">Doimo ustida turishi</div>
              <p className="text-xs text-foreground/60">
                Widget ekranda boshqa oynalar ustida turishi uchun.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-3">
              <span className="text-sm text-foreground/60">{widgetPinned ? "Pinned" : "Free"}</span>
              <input
                type="checkbox"
                checked={widgetPinned}
                onChange={event => toggleWidgetPinned(event.target.checked)}
                className="h-5 w-10 appearance-none rounded-full bg-white/10 transition checked:bg-primary-500"
              />
            </label>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-semibold">Haftalik reset</h2>
        <p className="mt-1 text-sm text-foreground/70">
          Agar yangi haftaga o'tgan bo'lsangiz limitni yangilash uchun reset qiling.
        </p>
        <button
          onClick={() => {
            void resetWeekMeta();
          }}
          className="mt-4 rounded-2xl border border-primary-500/40 bg-primary-500/20 px-5 py-3 text-sm font-semibold text-primary-100 transition hover:bg-primary-500/30"
        >
          Limitni yangilash
        </button>
      </section>

      <section className="rounded-3xl border border-danger/30 bg-danger/10 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-danger">To'liq reset</h2>
        <p className="mt-1 text-sm text-danger/80">
          Barcha foydalanuvchi ma'lumotlari o'chiriladi, dastur dastlabki holatiga qaytadi.
        </p>
        <button
          onClick={() => {
            void handleFullReset();
          }}
          disabled={resetting}
          className="mt-4 rounded-2xl border border-danger/40 bg-danger/20 px-5 py-3 text-sm font-semibold text-danger transition hover:bg-danger/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Tozalash va yangidan boshlash
        </button>
        {resetFeedback && (
          <div className="mt-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-2 text-xs text-danger/80">
            {resetFeedback}
          </div>
        )}
      </section>
    </div>
  );
};

const App = () => {
  const { hydrated, hydrate } = useHydratedFocusStore();
  const isWidget = typeof window !== "undefined" && window.location.hash === "#/widget";

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05050a] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/10 px-8 py-6 text-lg font-semibold">
          Focus Flow yuklanmoqda…
        </div>
      </div>
    );
  }

  if (isWidget) {
    return <WidgetView />;
  }

  return <AppShell />;
};

export default App;
