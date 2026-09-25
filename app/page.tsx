import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .single();

  const { data: today, error } = await supabase.rpc(
    "get_today_dashboard"
  );

  return (
    <main
      dir="rtl"
      style={{
        padding: 40,
        fontFamily: "Tahoma, sans-serif",
      }}
    >
      <h1>
        سلام {profile?.display_name ?? ""}
      </h1>

      <p>{user.email}</p>

      {error && (
        <pre style={{ color: "red" }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <h2>Today Dashboard Data</h2>

      <pre
        style={{
          background: "#f5f7f6",
          padding: 20,
          borderRadius: 16,
          overflow: "auto",
        }}
      >
        {JSON.stringify(today, null, 2)}
      </pre>
    </main>
  );
}