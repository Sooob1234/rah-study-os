import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f5f7f6",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: "Tahoma, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          border: "1px solid #e5ebe8",
          borderRadius: 20,
          padding: 28,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 15,
            background: "#0c2630",
            color: "#5ed1aa",
            display: "grid",
            placeItems: "center",
            fontSize: 25,
            fontWeight: 800,
            marginBottom: 24,
          }}
        >
          ر
        </div>

        <h1 style={{ margin: 0, color: "#13252b" }}>
          ورود به رَه
        </h1>

        <p
          style={{
            marginTop: 8,
            marginBottom: 24,
            color: "#73838a",
            fontSize: 13,
          }}
        >
          سیستم شخصی مدیریت مطالعه
        </p>

        {params.error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#fff1f0",
              color: "#c45b58",
              borderRadius: 12,
              fontSize: 12,
            }}
          >
            {params.error}
          </div>
        )}

        <form action={login}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            ایمیل
          </label>

          <input
            name="email"
            type="email"
            required
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid #e5ebe8",
              borderRadius: 12,
              marginBottom: 16,
              boxSizing: "border-box",
            }}
          />

          <label
            style={{
              display: "block",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            رمز عبور
          </label>

          <input
            name="password"
            type="password"
            required
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid #e5ebe8",
              borderRadius: 12,
              marginBottom: 20,
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              border: 0,
              background: "#0c2630",
              color: "#fff",
              padding: 13,
              borderRadius: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ورود
          </button>
        </form>
      </div>
    </main>
  );
}