import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  AlarmClock,
  CalendarCheck2,
  CheckCircle2,
  Flame,
  Hourglass,
  PartyPopper,
  Rocket,
  Sparkles,
  TimerReset,
  XCircle
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useFocusStore } from "@/state/useFocusStore";
import type { CoinLedgerEntry, TaskStatus } from "@/state/types";
import { getTodayKey } from "@/utils/date";

const jsDayToIso = (day: number) => (day + 6) % 7;

interface DashboardViewProps {
  onOpenPlanner: () => void;
}

interface TodayTaskView {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  status: TaskStatus;
  difficulty: string;
  reward: number;
  isCurrent: boolean;
  isUpcoming: boolean;
  isOverdue: boolean;
  category: string;
}

const generateCoachMessage = (progress: number, overdue: number, skipped: number, total: number) => {
  if (!total) {
    return "Bugun jadvalga hali vazifalar qo'shilmagan. Planner sahifasida haftangizni to'ldirib oling.";
  }
  if (progress >= 0.9) {
    return "Legend! Bugun deyarli hamma vazifani uddaladingiz. O'zingizga mukofot tayyorlang.";
  }
  if (skipped >= Math.ceil(total / 2)) {
    return "Bugun reja chetga chiqdi. Nima halaqit berganini yozib chiqing va ertangi jadvalda himoya loyihasini belgilang.";
  }
  if (overdue >= 2) {
    return "Ikki va undan ko'p vazifa hozircha bajarilmagan. Eng muhimini tanlab, dastlab shu birini yoping.";
  }
  if (progress >= 0.5) {
    return "Yaxshi start! Ritmni ushlab turing, keyingi sprintni ham shu motivatsiyada yakunlang.";
  }
  return "Bugun hali oldinda ko'p vaqt bor. Eng muhim vazifadan boshlang va fokusni 25 daqiqaga yo'naltiring.";
};

const statusPalette: Record<TaskStatus, { border: string; chip: string; text: string }> = {
  pending: {
    border: "border-white/10",
    chip: "bg-white/10 text-white/70",
    text: "text-white/70"
  },
  "in_progress": {
    border: "border-primary-500/40",
    chip: "bg-primary-500/20 text-primary-100",
    text: "text-primary-100"
  },
  completed: {
    border: "border-emerald-500/40",
    chip: "bg-emerald-500/20 text-emerald-200",
    text: "text-emerald-200"
  },
  skipped: {
    border: "border-danger/40",
    chip: "bg-danger/20 text-danger",
    text: "text-danger"
  }
};

const coachModes = [
  {
    id: "momentum",
    label: "Momentum boost",
    description: "Progressni tezlatish va keyingi blokni kuchli boshlash.",
    tone: "text-primary-200"
  },
  {
    id: "balance",
    label: "Balans",
    description: "Energiya va dam olishni nazorat qilib, ritmni ushlang.",
    tone: "text-emerald-200"
  },
  {
    id: "reset",
    label: "Reset",
    description: "Reja chippakka ketsa, yangi start uchun maydon tozalang.",
    tone: "text-amber-200"
  }
] as const;

type CoachMode = (typeof coachModes)[number]["id"];

interface CoachReport {
  headline: string;
  summary: string;
  actions: string[];
}

interface TodaySnapshot {
  tasks: TodayTaskView[];
  nextTask?: TodayTaskView;
  progress: number;
  skipped: number;
  overdue: number;
  completed: number;
  total: number;
}

const buildLocalCoachReport = ({
  mode,
  today,
  ledger,
  coinBank
}: {
  mode: CoachMode;
  today: TodaySnapshot;
  ledger: CoinLedgerEntry[];
  coinBank: number;
}): CoachReport => {
  const completion = Math.round(today.progress * 100);
  const netCoins = ledger.reduce((sum, entry) => sum + entry.amount, 0);
  const summaryParts: string[] = [];

  if (today.total === 0) {
    summaryParts.push(
      "Bugungi jadval hali bo'sh. Haftalik maqsadlaringizni eslab, kamida ikkita asosiy blok qo'shish vaqti."
    );
  } else {
    summaryParts.push(
      `Bugun ${today.total} ta blokdan ${today.completed} tasi bajarildi (${completion}% bajarilish).`
    );
  }

  if (today.overdue > 0) {
    summaryParts.push(
      `${today.overdue} ta vazifa hozircha kechikmoqda — eng muhimini tanlab, 15 daqiqalik fokus slot bilan yopib qo'ying.`
    );
  }

  if (today.skipped > 0) {
    summaryParts.push(
      `${today.skipped} ta blok o'tkazib yuborildi. Nima sabab bo'lganini yozib chiqing va ertangi jadvalda himoya strategiyasini belgilang.`
    );
  }

  if (netCoins !== 0) {
    const coinTrend = netCoins > 0 ? `+${netCoins}` : `${netCoins}`;
    summaryParts.push(
      `Coin harakati: ${coinTrend}. Joriy balans ${coinBank} coin — mukofot rejangizni yangilashni unutmang.`
    );
  }

  let headline = "";
  const actions: string[] = [];
  const nextTaskLabel = today.nextTask
    ? `${today.nextTask.title} (${format(today.nextTask.start, "HH:mm")})`
    : null;

  switch (mode) {
    case "momentum": {
      headline =
        completion >= 80
          ? "Momentumni ushlab turing!"
          : completion >= 50
          ? "Momentumni kuchaytirish vaqti"
          : "Bugun start uchun signal bering";
      if (nextTaskLabel) {
        actions.push(`Keyingi blok: ${nextTaskLabel}. 5 daqiqa tayyorgarlik rituali bilan boshlang.`);
      }
      if (today.overdue > 0) {
        actions.push(`Kechikayotgan vazifalardan bittasini tanlab, 15 daqidali mini-sprint bilan yeching.`);
      }
      actions.push("Fokusni himoyalash uchun telefoni flight modega, brauzer oynalarini esa yopiq holda qoldiring.");
      break;
    }
    case "balance": {
      headline =
        completion >= 70
          ? "Balans mukammal"
          : completion >= 40
          ? "Balansni tekislang"
          : "Energiya va reja o'rtasida balans qidiring";
      actions.push("3 daqiqa chuqur nafas mashqi yoki qisqa yurish bilan energiyani yangilang.");
      if (today.completed < today.total && today.total > 0) {
        actions.push("Eng yengil blokni tanlab, 'quick win' sifatida yakunlab qo'ying.");
      }
      actions.push("Kun yakunida ikki jumlalik refleksiya yozib, o'rganilgan darslarni qayd eting.");
      break;
    }
    case "reset": {
      headline = "Reset va qayta fokusing";
      if (today.total === 0) {
        actions.push("Bugungi kun uchun 2-3 ta 'must-do' blok kiriting va vaqtni belgilang.");
      }
      if (today.skipped > 0) {
        actions.push("O'tkazilgan vazifalardan bittasini ertangi jadvalga qayta joylashtiring.");
      }
      actions.push("Joriy ustuvorliklarni yozib chiqing va kalendarni yangilab oling.");
      if (!nextTaskLabel) {
        actions.push("Bugun uchun kichik g'alaba blokini tanlab, kech soatlarda ham bajarishga harakat qiling.");
      }
      break;
    }
  }

  if (netCoins < 0) {
    actions.push("Penaltilarni qoplash uchun ertaga bir 'boss' yoki 'deep work' blokini oldindan tayyorlang.");
  } else if (netCoins > 0) {
    actions.push("Mukofot do'konidan kichik sovrin tanlab, g'alabani mustahkamlab qo'ying.");
  }

  if (today.total > 0 && today.completed === today.total) {
    actions.push("Bugungi g'alabalarni yozib, ertangi kun uchun ustuvorlikni aniqlab qo'ying.");
  }

  const uniqueActions = Array.from(new Set(actions.filter(Boolean))).slice(0, 4);

  return {
    headline: headline || "Bugungi coach sharhi",
    summary: summaryParts.join(" "),
    actions: uniqueActions.length > 0 ? uniqueActions : ["Bugungi progress asosida qisqa refleksiya yozib qo'ying."]
  };
};

const DashboardView = ({ onOpenPlanner }: DashboardViewProps) => {
  const weeklyPlan = useFocusStore(state => state.weeklyPlan);
  const dailyLogs = useFocusStore(state => state.dailyLogs);
  const coinLedger = useFocusStore(state => state.coinLedger);
  const coinBank = useFocusStore(state => state.coinBank);
  const quickNotes = useFocusStore(state => state.quickNotes);
  const addQuickNote = useFocusStore(state => state.addQuickNote);
  const removeQuickNote = useFocusStore(state => state.removeQuickNote);
  const markTaskStatus = useFocusStore(state => state.markTaskStatus);

  const todayKey = getTodayKey();
  const [noteInput, setNoteInput] = useState("");
  const [coachMode, setCoachMode] = useState<CoachMode>("momentum");

  const todayData = useMemo(() => {
    const now = new Date();
    const isoDay = jsDayToIso(now.getDay());
    const template = weeklyPlan
      .filter(task => task.weekday === isoDay)
      .map(task => {
        const start = new Date();
        start.setHours(task.hour, task.minute ?? 0, 0, 0);
        const end = new Date(start.getTime() + task.durationMinutes * 60 * 1000);
        const logEntry = dailyLogs[todayKey]?.tasks.find(entry => entry.taskId === task.id);
        const status = logEntry?.status ?? "pending";
        const isCurrent = now >= start && now < end && status !== "completed";
        const isUpcoming = now < start && status !== "completed";
        const isOverdue = now >= end && status !== "completed" && status !== "skipped";
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          start,
          end,
          status,
          difficulty: task.difficulty,
          reward: task.coinReward,
          isCurrent,
          isUpcoming,
          isOverdue,
          category: task.category
        } satisfies TodayTaskView;
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const completed = template.filter(task => task.status === "completed").length;
    const skipped = template.filter(task => task.status === "skipped").length;
    const overdue = template.filter(task => task.isOverdue).length;
    const total = template.length;
    const progress = total ? completed / total : 0;

    const nextTask = template.find(task => task.isCurrent || task.isUpcoming);
    return {
      tasks: template,
      nextTask,
      progress,
      skipped,
      overdue,
      completed,
      total
    };
  }, [weeklyPlan, dailyLogs, todayKey]);

  const todayLedgerFull = useMemo(() => {
    const today = new Date();
    return coinLedger
      .filter(entry => {
        if (!entry.date) return false;
        const entryDate = new Date(entry.date);
        return isSameDay(entryDate, today);
      });
  }, [coinLedger, todayKey]);

  const todayLedger = useMemo(() => todayLedgerFull.slice(0, 6), [todayLedgerFull]);

  const coachMessage = useMemo(
    () =>
      generateCoachMessage(
        todayData.progress,
        todayData.overdue,
        todayData.skipped,
        todayData.total
      ),
    [todayData]
  );

  const coachReport = useMemo(
    () =>
      buildLocalCoachReport({
        mode: coachMode,
        today: todayData,
        ledger: todayLedgerFull,
        coinBank
      }),
    [coachMode, todayData, todayLedgerFull, coinBank]
  );

  const activeMode = useMemo(
    () => coachModes.find(mode => mode.id === coachMode),
    [coachMode]
  );

  const handleAction = async (taskId: string, status: TaskStatus) => {
    await markTaskStatus(todayKey, { taskId, status });
  };

  const noteSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!noteInput.trim()) return;
    await addQuickNote(noteInput.trim());
    setNoteInput("");
  };

  const handleSaveSummary = () => {
    const text =
      coachReport.summary.length > 200
        ? `${coachReport.summary.slice(0, 197)}…`
        : coachReport.summary;
    void addQuickNote(`Coach: ${text}`);
  };

  const handleCaptureAction = (action: string) => {
    void addQuickNote(`Coach: ${action}`);
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/10 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,_rgba(53,102,255,0.18),_transparent_70%)]" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
                <Flame className="h-3.5 w-3.5 text-accent" /> Focus Pulse
              </div>
              <h2 className="text-3xl font-semibold leading-tight">
                {todayData.nextTask ? todayData.nextTask.title : "Bugun rejalar bo'sh"}
              </h2>
              <p className="max-w-xl text-sm text-white/70">
                {todayData.nextTask
                  ? `Keyingi blok ${format(todayData.nextTask.start, "HH:mm")} da boshlanadi. Mukofot: ${todayData.nextTask.reward} coin`
                  : "Planner sahifasida mukammal haftangizni qurib chiqing."}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {todayData.nextTask ? (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                      <AlarmClock className="h-3.5 w-3.5" />
                      {format(todayData.nextTask.start, "HH:mm")}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                      <Rocket className="h-3.5 w-3.5" /> {todayData.nextTask.difficulty.toUpperCase()}
                    </span>
                  </>
                ) : (
                  <button
                    onClick={onOpenPlanner}
                    className="rounded-full bg-primary-500/20 px-4 py-2 text-xs font-semibold text-primary-100 transition hover:bg-primary-500/30"
                  >
                    Jadval qo'shish uchun Plannerga o'tish
                  </button>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {todayData.completed} / {todayData.total} bajarildi
                </div>
                <div className="flex items-center gap-2">
                  <Hourglass className="h-4 w-4 text-warning" />
                  {todayData.overdue} kechikkan blok
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-danger" /> {todayData.skipped} o'tkazildi
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/50">Bugungi progress</div>
                <div className="mt-2 text-3xl font-semibold">{Math.round(todayData.progress * 100)}%</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/20">
                <Sparkles className="h-6 w-6 text-primary-200" />
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600"
                style={{ width: `${Math.min(100, Math.round(todayData.progress * 100))}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-white/60">{coachMessage}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/50">AI tahlil</div>
                <h4 className={`mt-2 text-lg font-semibold text-white ${activeMode?.tone ?? ""}`}>
                  {coachReport.headline}
                </h4>
                <p className="mt-3 whitespace-pre-line text-sm text-white/70">{coachReport.summary}</p>
              </div>
              <button
                onClick={handleSaveSummary}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 transition hover:bg-white/10"
              >
                Coach yozuvini saqlash
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {coachModes.map(mode => {
                const active = mode.id === coachMode;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setCoachMode(mode.id)}
                    className={clsx(
                      "rounded-full border px-4 py-2 text-xs font-semibold transition",
                      active
                        ? "border-primary-400 bg-primary-500/20 text-primary-100"
                        : "border-white/10 bg-black/20 text-white/60 hover:bg-white/10"
                    )}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
            {activeMode?.description && (
              <p className="mt-2 text-xs text-white/40">{activeMode.description}</p>
            )}
            <div className="mt-4 space-y-2">
              {coachReport.actions.map(action => (
                <div
                  key={action}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70"
                >
                  <span>{action}</span>
                  <button
                    onClick={() => handleCaptureAction(action)}
                    className="text-xs font-semibold text-primary-200 transition hover:text-primary-100"
                  >
                    Quick notesga qo'shish
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6 xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Bugungi jadval</h3>
              <p className="text-xs text-white/50">Vaqt o'tkazib yuborilsa qizil rangda yonadi</p>
            </div>
            <button
              onClick={onOpenPlanner}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 transition hover:bg-white/10"
            >
              Plannerga o'tish
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {todayData.tasks.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/50">
                Hali bugungi kun uchun bloklar qo'shilmagan.
              </div>
            )}
            {todayData.tasks.map(task => (
              <div
                key={task.id}
                className={clsx(
                  "flex flex-col gap-3 rounded-2xl border bg-black/30 p-4 transition",
                  statusPalette[task.status].border,
                  task.isOverdue && task.status !== "completed"
                    ? "ring-1 ring-danger/60"
                    : task.isCurrent
                    ? "ring-1 ring-primary-500/40"
                    : ""
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{task.title}</div>
                    <div className="text-xs text-white/50">
                      {format(task.start, "HH:mm")} – {format(task.end, "HH:mm")} · {task.reward} coin
                    </div>
                  </div>
                  <span className={clsx("rounded-full px-3 py-1 text-xs", statusPalette[task.status].chip)}>
                    {task.status === "pending" && task.isOverdue ? "Overdue" : task.status.replace("_", " ")}
                  </span>
                </div>
                {task.description && <p className="text-sm text-white/60">{task.description}</p>}
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                    <CalendarCheck2 className="h-3 w-3" /> {task.category}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                    <TimerReset className="h-3 w-3" /> {task.difficulty.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      void handleAction(task.id, "in_progress");
                    }}
                    disabled={task.status === "in_progress"}
                    className={clsx(
                      "rounded-full border border-primary-500/40 bg-primary-500/15 px-4 py-2 text-xs font-semibold transition hover:bg-primary-500/20",
                      task.status === "in_progress" ? "text-primary-100 opacity-80" : "text-primary-100",
                      "disabled:cursor-not-allowed disabled:opacity-60"
                    )}
                  >
                    {task.status === "in_progress" ? "Fokus davom etmoqda" : "Fokusni boshlash"}
                  </button>
                  <button
                    onClick={() => {
                      void handleAction(task.id, "completed");
                    }}
                    className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    Bajarildi
                  </button>
                  <button
                    onClick={() => {
                      void handleAction(task.id, "skipped");
                    }}
                    className="rounded-full border border-danger/40 bg-danger/10 px-4 py-2 text-xs font-semibold text-danger transition hover:bg-danger/15"
                  >
                    O'tkazib yuborildi
                  </button>
                  <button
                    onClick={() => {
                      void handleAction(task.id, "pending");
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Bugungi coin harakati</h3>
              <div className="rounded-full bg-white/10 px-4 py-1 text-xs text-white/60">
                Balans: {coinBank}
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-white/60">
              {todayLedger.length === 0 && <div className="text-xs text-white/40">Hali harakat yo'q.</div>}
              {todayLedger.map(entry => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/30 px-4 py-3"
                >
                  <div>
                    <div className="text-sm text-white/80">{entry.label}</div>
                    <div className="text-xs text-white/40">
                      {format(new Date(entry.date), "HH:mm")} · {entry.type}
                    </div>
                  </div>
                  <div
                    className={clsx(
                      "text-sm font-semibold",
                      entry.amount >= 0 ? "text-emerald-300" : "text-danger"
                    )}
                  >
                    {entry.amount >= 0 ? `+${entry.amount}` : entry.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6">
            <h3 className="text-lg font-semibold">Tezkor eslatmalar</h3>
            <p className="text-xs text-white/50">Kunning oxirida tahlil qilish uchun yozib boring.</p>
            <form onSubmit={noteSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={noteInput}
                onChange={event => setNoteInput(event.target.value)}
                placeholder="Bugungi kuzatuv..."
                className="flex-1 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary-400 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-primary-500/70 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary-900/30 transition hover:bg-primary-500 sm:w-auto"
              >
                Qo'shish
              </button>
            </form>
            <div className="mt-4 space-y-2 text-sm">
              {quickNotes.length === 0 && <div className="text-xs text-white/40">Hali yozuv yo'q.</div>}
              {quickNotes.slice(0, 5).map(note => (
                <div
                  key={note}
                  className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/40 px-4 py-3 text-white/70 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex items-start gap-2">
                    <PartyPopper className="mt-1 h-4 w-4 text-accent" />
                    <p>{note}</p>
                  </div>
                  <button
                    onClick={() => {
                      void removeQuickNote(note);
                    }}
                    className="self-end text-xs text-white/40 transition hover:text-danger sm:self-auto"
                  >
                    o'chirish
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default DashboardView;
