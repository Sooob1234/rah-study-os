import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type R = Record<string, unknown>;

function rec(v: unknown): R {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as R) : {};
}
function n(v: unknown, fallback = 0) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return fallback;
}
function s(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v : fallback;
}
function pct(a: number, b: number) {
  return b ? Math.min(100, Math.round((a / b) * 100)) : 0;
}
function Icon({ name }: { name: string }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "sun") return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2M20 12h2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"/></svg>;
  if (name === "calendar") return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>;
  if (name === "bookmark") return <svg {...p}><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>;
  if (name === "book") return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>;
  if (name === "chart") return <svg {...p}><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>;
  if (name === "exam") return <svg {...p}><path d="m2 10 10-5 10 5-10 5L2 10Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>;
  if (name === "compass") return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4 4-2Z"/></svg>;
  if (name === "plus") return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === "list") return <svg {...p}><path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 2-2M4 12h3M4 18h3"/></svg>;
  if (name === "clock") return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
  if (name === "gauge") return <svg {...p}><path d="M4.9 19.1a10 10 0 1 1 14.2 0"/><path d="m12 12 4-4"/><path d="M7 17h10"/></svg>;
  if (name === "brain") return <svg {...p}><path d="M9.5 4.5A3 3 0 0 0 4 6v1a3 3 0 0 0 0 5 3 3 0 0 0 2 5.8V19a3 3 0 0 0 5 2.2V4.8a3 3 0 0 0-1.5-.3ZM14.5 4.5A3 3 0 0 1 20 6v1a3 3 0 0 1 0 5 3 3 0 0 1-2 5.8V19a3 3 0 0 1-5 2.2V4.8a3 3 0 0 1 1.5-.3Z"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="8"/></svg>;
}

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: today, error }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("user_id", user.id).single(),
    supabase.rpc("get_today_dashboard"),
  ]);

  const data = rec(today);
  const kpis = rec(data.kpis);
  const reviews = rec(data.reviews);
  const exam = rec(data.next_exam);
  const parts = Array.isArray(data.parts) ? data.parts.map(rec) : [];

  const partCount = n(kpis.part_count, parts.length);
  const plannedTests = n(kpis.planned_tests);
  const completedTests = n(kpis.completed_tests);
  const plannedMinutes = n(kpis.planned_minutes);
  const actualMinutes = n(kpis.actual_minutes);
  const avgExecution = n(kpis.avg_execution);
  const streak = n(data.streak);
  const dueReviews = n(reviews.due_count);
  const overdueReviews = n(reviews.overdue_count);
  const completedParts = parts.filter((x) => s(x.status) === "COMPLETED").length;
  const testProgress = pct(completedTests, plannedTests);
  const partProgress = pct(completedParts, partCount);
  const timeProgress = pct(actualMinutes, plannedMinutes);
  const score = Math.round(avgExecution || testProgress * .45 + partProgress * .35 + timeProgress * .2);

  const dateText = new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const examTitle = s(exam.title, "آزمونی ثبت نشده");
  const examDate = s(exam.exam_date);
  const examTime = s(exam.start_time);
  const days = n(exam.days_remaining);

  return (
    <div className="app" dir="rtl">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark">ر</div><div><strong>رَه</strong><small>Study OS</small></div></div>
        <div className="navSectionLabel">فضای کار</div>
        <nav className="nav">
          <a className="active" href="/"><span className="iconWrap"><Icon name="sun"/></span>امروز</a>
          <button><span className="iconWrap"><Icon name="calendar"/></span>برنامه‌ریز</button>
          <button><span className="iconWrap"><Icon name="bookmark"/></span>مرورها</button>
          <button><span className="iconWrap"><Icon name="book"/></span>کتابخانه تست</button>
          <button><span className="iconWrap"><Icon name="chart"/></span>گزارش‌ها</button>
          <button><span className="iconWrap"><Icon name="exam"/></span>آزمون‌ها</button>
        </nav>
        <div className="navSectionLabel">مسیر</div>
        <nav className="nav"><button><span className="iconWrap"><Icon name="compass"/></span>Mission Control</button></nav>
        <div className="sideFooter"><div className="sideFooterCard"><b>{examTitle}</b><small>{examDate ? Math.max(days,0).toLocaleString("fa-IR") + " روز مانده" : "هنوز آزمون آینده ثبت نشده"}</small><div className="sideFooterBar"><i style={{width: Math.min(100, Math.max(0, avgExecution)) + "%"}}/></div></div></div>
      </aside>

      <main className="main">
        <section className="page">
          <div className="header">
            <div><div className="eyebrow">{dateText}</div><h1>برنامه امروز</h1><p>امروز اول برنامه را مرور می‌کنی، بعد از همان‌جا وارد اجرا می‌شوی. ثبت اطلاعات باید سریع، تمیز و بی‌اصطکاک باشد.</p></div>
            <div className="actions"><span className="pill desktopOnly">🔥 {streak.toLocaleString("fa-IR")} روز متوالی</span><button className="btn primary"><Icon name="plus"/>پارت جدید</button></div>
          </div>

          {error ? <div className="errorBox">دریافت داده‌های امروز با خطا روبه‌رو شد.</div> : null}

          <div className="todayLayout">
            <div className="stack">
              <div className="examBanner">
                <div className="top">
                  <div><div className="label">آزمون بعدی</div><h2>{examTitle}</h2><div className="meta">{examDate ? examDate + (examTime ? " · ساعت " + examTime.slice(0,5) : "") : "از بخش آزمون‌ها، آزمون بعدی را ثبت کن."}</div></div>
                  <div className="days"><b className="mono">{examDate ? Math.max(days,0).toLocaleString("fa-IR") : "—"}</b><span>روز مانده</span></div>
                </div>
                <div className="progressWrap"><div className="progressHead"><span>پیشرفت بودجه تا آزمون</span><span>{Math.round(avgExecution).toLocaleString("fa-IR")}٪</span></div><div className="track"><i style={{width: Math.min(100, Math.max(0, avgExecution)) + "%"}}/></div></div>
              </div>

              <div className="kpiGrid">
                <div className="card kpi"><div className="iconBox"><Icon name="list"/></div><b className="mono">{partCount.toLocaleString("fa-IR")}</b><small>پارت امروز</small></div>
                <div className="card kpi"><div className="iconBox"><span className="dotIcon">●</span></div><b className="mono">{plannedTests.toLocaleString("fa-IR")}</b><small>تست هدف</small></div>
                <div className="card kpi"><div className="iconBox"><Icon name="clock"/></div><b className="mono">{plannedMinutes.toLocaleString("fa-IR")}</b><small>دقیقه برنامه</small></div>
                <div className="card kpi"><div className="iconBox"><Icon name="gauge"/></div><b className="mono">{Math.round(avgExecution).toLocaleString("fa-IR")}٪</b><small>تطابق هفته</small></div>
              </div>

              <div className="sectionTitle"><h2>پارت‌های امروز</h2><span>ترتیب مهم نیست · بعد از انجام Collapse می‌شوند</span></div>

              <div className="sessionList">
                {parts.length ? parts.map((part, index) => {
                  const title = s(part.title, "بخش مطالعه");
                  const status = s(part.status, "PLANNED");
                  const done = status === "COMPLETED";
                  const planned = n(part.planned_test_count);
                  const complete = n(part.completed_test_count);
                  const mins = n(part.planned_minutes);
                  const actual = n(part.actual_minutes);
                  const kind = title.includes("GMAT") ? "blue" : title.includes("زبان") ? "amber" : title.includes("مرور") ? "gray" : "";
                  return (
                    <div className={"card session " + (done ? "done" : "")} key={s(part.id, String(index))}>
                      <div className={"subjectBox " + kind}><Icon name={title.includes("GMAT") ? "brain" : title.includes("مرور") ? "bookmark" : "list"}/></div>
                      <div><div className="sessionTitle">{title}</div><div className="sessionMeta">{planned.toLocaleString("fa-IR")} تست · {mins.toLocaleString("fa-IR")} دقیقه</div>{!done ? <div className="chips"><span className="chip">{complete.toLocaleString("fa-IR")} / {planned.toLocaleString("fa-IR")} تست</span>{actual ? <span className="chip">{actual.toLocaleString("fa-IR")} دقیقه واقعی</span> : null}</div> : null}</div>
                      <div className="sessionActions"><small>{done ? "انجام شد" : status === "IN_PROGRESS" ? "در حال انجام" : status === "PARTIAL" ? "نیمه‌تمام" : "آماده شروع"}</small>{!done ? <button className={"btn " + (status === "IN_PROGRESS" ? "jade" : "secondary")}>{status === "IN_PROGRESS" ? "ادامه" : "شروع"}</button> : null}</div>
                    </div>
                  );
                }) : (
                  <div className="card emptySessions"><div className="emptySessionIcon"><Icon name="calendar"/></div><b>برای امروز هنوز پارت مطالعه‌ای ثبت نشده</b><span>از «پارت جدید» برنامه امروزت را ثبت کن؛ بعد همین‌جا وارد اجرا می‌شوی.</span><button className="btn primary"><Icon name="plus"/>ساخت اولین پارت</button></div>
                )}
              </div>
            </div>

            <aside className="rightRail">
              <div className="card scoreRingCard">
                <div className="scoreTop"><div><h3>Daily Score</h3><span>ترکیبی از اجرای پارت‌ها و تعداد تست</span></div><span className="pill">امروز</span></div>
                <div className="ringWrap">
                  <div className="ringHolder"><div className="ring" style={{background: "conic-gradient(var(--jade) 0 " + score + "%, #e9efec " + score + "% 100%)"}}/><div className="ringInner"><b className="mono">{score.toLocaleString("fa-IR")}٪</b><small>پیشرفت</small></div></div>
                  <div className="metrics">
                    <div className="metricLine"><div className="label"><span>تعداد تست</span><span className="mono">{completedTests.toLocaleString("fa-IR")} / {plannedTests.toLocaleString("fa-IR")}</span></div><div className="track"><i style={{width: testProgress + "%"}}/></div></div>
                    <div className="metricLine"><div className="label"><span>پارت‌ها</span><span className="mono">{completedParts.toLocaleString("fa-IR")} / {partCount.toLocaleString("fa-IR")}</span></div><div className="track"><i style={{width: partProgress + "%"}}/></div></div>
                    <div className="metricLine"><div className="label"><span>زمان</span><span className="mono">{actualMinutes.toLocaleString("fa-IR")} / {plannedMinutes.toLocaleString("fa-IR")} دقیقه</span></div><div className="track blue"><i style={{width: timeProgress + "%"}}/></div></div>
                  </div>
                </div>
              </div>

              <div className="card cardPad reviewSummary"><div className="cardHeader"><h3>مرورهای آماده</h3><span>کارت خلاصه</span></div><div className="reviewItem"><div><b>{dueReviews.toLocaleString("fa-IR")} تست آماده مرور</b><small>{overdueReviews ? overdueReviews.toLocaleString("fa-IR") + " مورد عقب‌افتاده" : "مورد عقب‌افتاده نداری"}</small></div><button className="btn ghost">باز کردن</button></div></div>

              <div className="miniNotice"><b>🔥 {streak.toLocaleString("fa-IR")} روز پیوسته</b><p>رَه روند واقعی مطالعه را نگه می‌دارد؛ اینجا قرار است پیشرفتت را ببینی، نه فقط برنامه‌ای که نوشته‌ای.</p></div>
            </aside>
          </div>
        </section>
      </main>

      <nav className="bottomNav"><a className="active" href="/"><Icon name="sun"/><span>امروز</span></a><button><Icon name="calendar"/><span>برنامه</span></button><button className="quickAdd"><Icon name="plus"/></button><button><Icon name="book"/><span>کتابخانه</span></button><button><Icon name="chart"/><span>گزارش</span></button></nav>
    </div>
  );
}
