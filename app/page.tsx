import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type JsonRecord = Record<string, unknown>;

type StudyPart = {
  id?: string;
  title: string;
  subtitle?: string;
  plannedMinutes?: number;
  actualMinutes?: number;
  plannedTests?: number;
  completedTests?: number;
  status?: string;
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function firstRecord(value: unknown): JsonRecord {
  if (Array.isArray(value)) return asRecord(value[0]);
  return asRecord(value);
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getList(source: JsonRecord, keys: string[]): unknown[] {
  for (const key of keys) {
    if (Array.isArray(source[key])) return source[key] as unknown[];
  }
  return [];
}

function normalizePart(value: unknown): StudyPart {
  const item = asRecord(value);
  const progress = asRecord(item.progress);
  const title =
    str(item.title) ??
    str(item.name) ??
    str(item.subject_name) ??
    str(item.label) ??
    "بخش مطالعه";

  const topic =
    str(item.topic_name) ??
    str(item.topic) ??
    str(item.subtitle) ??
    str(item.description);

  return {
    id: str(item.id) ?? str(item.study_part_id),
    title,
    subtitle: topic,
    plannedMinutes:
      num(item.planned_minutes) ??
      num(item.plannedMinutes) ??
      num(item.target_minutes),
    actualMinutes:
      num(item.actual_minutes) ??
      num(item.actualMinutes) ??
      num(item.spent_minutes),
    plannedTests:
      num(item.planned_tests) ??
      num(item.plannedTests) ??
      num(item.target_count) ??
      num(item.total_tests),
    completedTests:
      num(item.completed_tests) ??
      num(item.completedTests) ??
      num(item.done_count) ??
      num(progress.completed) ??
      num(progress.done),
    status: str(item.status),
  };
}

function formatMinutes(value?: number) {
  if (!value) return "۰ دقیقه";
  if (value < 60) return `${value.toLocaleString("fa-IR")} دقیقه`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes
    ? `${hours.toLocaleString("fa-IR")} ساعت و ${minutes.toLocaleString("fa-IR")} دقیقه`
    : `${hours.toLocaleString("fa-IR")} ساعت`;
}

function statusLabel(status?: string) {
  switch (status) {
    case "COMPLETED":
      return "انجام شده";
    case "IN_PROGRESS":
      return "در حال انجام";
    case "PARTIAL":
      return "نیمه‌تمام";
    case "SKIPPED":
      return "رد شده";
    default:
      return "برنامه‌ریزی شده";
  }
}

function statusClass(status?: string) {
  switch (status) {
    case "COMPLETED":
      return "is-complete";
    case "IN_PROGRESS":
      return "is-progress";
    case "PARTIAL":
      return "is-partial";
    default:
      return "";
  }
}

function Icon({ name }: { name: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "calendar") {
    return (
      <svg {...common}>
        <path d="M6 2v4M18 2v4M3 9h18" />
        <rect x="3" y="4" width="18" height="17" rx="3" />
      </svg>
    );
  }
  if (name === "library") {
    return (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
      </svg>
    );
  }
  if (name === "target") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M18 6l3-3M18 3h3v3" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }
  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  if (name === "flame") {
    return (
      <svg {...common}>
        <path d="M12 22c4 0 7-2.8 7-6.7 0-2.8-1.6-5.1-4.1-7.4.1 2-1 3.2-2 3.8.2-4-2.1-7.2-5.5-9.7.4 3.4-2.4 6.4-2.4 10.6C5 18 8 22 12 22Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2.5 1.5" />
    </svg>
  );
}

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: today, error }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single(),
    supabase.rpc("get_today_dashboard"),
  ]);

  const payload = firstRecord(today);
  const rawParts = getList(payload, ["study_parts", "parts", "plan", "today_parts"]);
  const parts = rawParts.map(normalizePart);

  const plannedMinutes =
    num(payload.planned_minutes) ??
    num(payload.total_planned_minutes) ??
    parts.reduce((sum, part) => sum + (part.plannedMinutes ?? 0), 0);

  const actualMinutes =
    num(payload.actual_minutes) ??
    num(payload.total_actual_minutes) ??
    parts.reduce((sum, part) => sum + (part.actualMinutes ?? 0), 0);

  const plannedTests =
    num(payload.planned_tests) ??
    num(payload.total_planned_tests) ??
    parts.reduce((sum, part) => sum + (part.plannedTests ?? 0), 0);

  const completedTests =
    num(payload.completed_tests) ??
    num(payload.total_completed_tests) ??
    parts.reduce((sum, part) => sum + (part.completedTests ?? 0), 0);

  const dueReviews =
    num(payload.due_reviews) ??
    num(payload.review_count) ??
    num(payload.reviews_due) ??
    0;

  const streak =
    num(payload.streak) ??
    num(payload.current_streak) ??
    num(payload.study_streak) ??
    0;

  const completedParts = parts.filter((part) => part.status === "COMPLETED").length;
  const planProgress = parts.length ? Math.round((completedParts / parts.length) * 100) : 0;

  const persianToday = new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const displayName = profile?.display_name || "سبحان";

  return (
    <div className="rah-app" dir="rtl">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ر</div>
          <div>
            <strong>رَه</strong>
            <span>Study OS</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="ناوبری اصلی">
          <a className="nav-item active" href="/">
            <Icon name="check" />
            <span>امروز</span>
          </a>
          <button className="nav-item" type="button" disabled title="در نسخه بعد">
            <Icon name="calendar" />
            <span>برنامه‌ریز</span>
          </button>
          <button className="nav-item" type="button" disabled title="در نسخه بعد">
            <Icon name="library" />
            <span>کتابخانه تست</span>
          </button>
          <button className="nav-item" type="button" disabled title="در نسخه بعد">
            <Icon name="chart" />
            <span>بینش‌ها</span>
          </button>
          <button className="nav-item" type="button" disabled title="در نسخه بعد">
            <Icon name="target" />
            <span>ماموریت</span>
          </button>
        </nav>

        <div className="sidebar-goal">
          <span className="eyebrow">هدف اصلی</span>
          <strong>MBA مالی شریف</strong>
          <small>رتبه هدف: زیر ۴۰</small>
          <div className="goal-line">
            <span style={{ width: "36%" }} />
          </div>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div>
            <p className="date-line">{persianToday}</p>
            <h1>سلام {displayName}، برنامه امروزت اینجاست.</h1>
          </div>
          <div className="top-actions">
            <div className="streak-chip">
              <Icon name="flame" />
              <span>{streak.toLocaleString("fa-IR")} روز پیوسته</span>
            </div>
            <button className="profile-button" type="button" aria-label="حساب کاربری">
              {displayName.slice(0, 1)}
            </button>
          </div>
        </header>

        {error ? (
          <section className="error-card">
            <strong>دریافت اطلاعات امروز کامل نشد.</strong>
            <span>اتصال برقرار است، اما داشبورد امروز خطا برگرداند.</span>
          </section>
        ) : null}

        <section className="hero-grid">
          <div className="today-hero">
            <div className="hero-copy">
              <span className="eyebrow light">تمرکز امروز</span>
              <h2>{parts.length ? `${parts.length.toLocaleString("fa-IR")} بخش مطالعه` : "یک روز تازه برای ساختن ریتم"}</h2>
              <p>
                {parts.length
                  ? `${formatMinutes(plannedMinutes)} برنامه‌ریزی شده و ${plannedTests.toLocaleString("fa-IR")} تست در برنامه داری.`
                  : "برنامه امروز هنوز خالی است. از برنامه‌ریز، اولین بخش مطالعه را برای امروز ثبت کن."}
              </p>
              <div className="hero-meta">
                <span><Icon name="clock" /> {formatMinutes(actualMinutes)} انجام‌شده</span>
                <span><Icon name="check" /> {completedTests.toLocaleString("fa-IR")} تست ثبت‌شده</span>
              </div>
            </div>
            <div className="score-ring" style={{ "--progress": `${planProgress * 3.6}deg` } as React.CSSProperties}>
              <div>
                <strong>{planProgress.toLocaleString("fa-IR")}٪</strong>
                <span>اجرای برنامه</span>
              </div>
            </div>
          </div>

          <div className="next-exam-card">
            <div className="exam-head">
              <span className="eyebrow">آزمون بعدی</span>
              <span className="dot-live" />
            </div>
            <strong>مرحله اول مدرسان شریف</strong>
            <p>جمعه ۱۵ آبان · ساعت ۰۸:۳۰</p>
            <div className="exam-countdown">
              <div><strong>۴۹</strong><span>روز</span></div>
              <div><strong>:</strong></div>
              <div><strong>هدف</strong><span>اجرای کامل بودجه</span></div>
            </div>
          </div>
        </section>

        <section className="kpi-grid" aria-label="شاخص‌های امروز">
          <article className="kpi-card">
            <span className="kpi-icon"><Icon name="clock" /></span>
            <div><small>زمان مطالعه</small><strong>{formatMinutes(actualMinutes)}</strong></div>
            <span className="kpi-sub">از {formatMinutes(plannedMinutes)}</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-icon"><Icon name="check" /></span>
            <div><small>تست‌ها</small><strong>{completedTests.toLocaleString("fa-IR")}</strong></div>
            <span className="kpi-sub">از {plannedTests.toLocaleString("fa-IR")} برنامه</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-icon"><Icon name="library" /></span>
            <div><small>مرور سررسید</small><strong>{dueReviews.toLocaleString("fa-IR")}</strong></div>
            <span className="kpi-sub">مورد برای مرور</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-icon"><Icon name="flame" /></span>
            <div><small>روند پیوسته</small><strong>{streak.toLocaleString("fa-IR")}</strong></div>
            <span className="kpi-sub">روز متوالی</span>
          </article>
        </section>

        <div className="content-grid">
          <section className="panel plan-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">برنامه روز</span>
                <h2>بخش‌های مطالعه</h2>
              </div>
              <span className="count-badge">{parts.length.toLocaleString("fa-IR")} بخش</span>
            </div>

            <div className="parts-list">
              {parts.length ? (
                parts.map((part, index) => {
                  const testsDone = part.completedTests ?? 0;
                  const testsPlan = part.plannedTests ?? 0;
                  const progress = testsPlan ? Math.min(100, Math.round((testsDone / testsPlan) * 100)) : 0;

                  return (
                    <article className={`study-part ${statusClass(part.status)}`} key={part.id ?? `${part.title}-${index}`}>
                      <div className="part-index">{(index + 1).toLocaleString("fa-IR")}</div>
                      <div className="part-main">
                        <div className="part-title-row">
                          <div>
                            <h3>{part.title}</h3>
                            {part.subtitle ? <p>{part.subtitle}</p> : null}
                          </div>
                          <span className="status-pill">{statusLabel(part.status)}</span>
                        </div>

                        <div className="part-stats">
                          {part.plannedMinutes !== undefined ? (
                            <span><Icon name="clock" /> {formatMinutes(part.plannedMinutes)}</span>
                          ) : null}
                          {part.plannedTests !== undefined ? (
                            <span><Icon name="check" /> {testsDone.toLocaleString("fa-IR")} / {part.plannedTests.toLocaleString("fa-IR")} تست</span>
                          ) : null}
                        </div>

                        <div className="part-progress" aria-label={`پیشرفت ${progress} درصد`}>
                          <span style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <button className="start-button" type="button" disabled>
                        {part.status === "COMPLETED" ? "تمام شد" : part.status === "IN_PROGRESS" ? "ادامه" : "شروع"}
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">
                  <div className="empty-icon"><Icon name="calendar" /></div>
                  <h3>برای امروز هنوز برنامه‌ای ثبت نشده</h3>
                  <p>بعد از ساخت صفحه برنامه‌ریز، بخش‌های روزانه از همین‌جا قابل شروع و ثبت خواهند بود.</p>
                </div>
              )}
            </div>
          </section>

          <aside className="right-column">
            <section className="panel review-panel">
              <div className="panel-head compact">
                <div>
                  <span className="eyebrow">مرور امروز</span>
                  <h2>{dueReviews.toLocaleString("fa-IR")} مورد سررسید</h2>
                </div>
                <span className="review-mark"><Icon name="library" /></span>
              </div>
              <p>مرورهای بوکمارک‌شده و تست‌های نیازمند بازگشت، بدون تغییر خودکار برنامه اصلی.</p>
              <button className="secondary-action" type="button" disabled>باز کردن صف مرور</button>
            </section>

            <section className="panel momentum-panel">
              <span className="eyebrow">Momentum</span>
              <h2>{streak ? "ریتمت را حفظ کن" : "ریتمت را از امروز بساز"}</h2>
              <div className="week-dots" aria-label="هفته جاری">
                {["ش","ی","د","س","چ","پ","ج"].map((day, index) => (
                  <div key={day + index} className={index < Math.min(streak, 7) ? "done" : ""}>
                    <span>{day}</span>
                    <i>{index < Math.min(streak, 7) ? "✓" : ""}</i>
                  </div>
                ))}
              </div>
            </section>

            <section className="quote-card">
              <span>اصل امروز</span>
              <strong>کیفیت اجرا مهم‌تر از شلوغ بودن برنامه است.</strong>
              <p>رَه فقط واقعیت مطالعه را ثبت می‌کند؛ تصمیم برنامه همیشه دست توست.</p>
            </section>
          </aside>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="ناوبری موبایل">
        <a className="mobile-nav-item active" href="/"><Icon name="check" /><span>امروز</span></a>
        <button className="mobile-nav-item" type="button" disabled><Icon name="calendar" /><span>برنامه</span></button>
        <button className="mobile-plus" type="button" disabled aria-label="ثبت سریع"><Icon name="plus" /></button>
        <button className="mobile-nav-item" type="button" disabled><Icon name="library" /><span>کتابخانه</span></button>
        <button className="mobile-nav-item" type="button" disabled><Icon name="chart" /><span>بینش</span></button>
      </nav>
    </div>
  );
}
