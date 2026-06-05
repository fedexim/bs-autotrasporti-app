import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const today = new Date().toISOString().split("T")[0];

    const { data: autisti } = await supabase
      .from("autisti")
      .select("username, nome");

    const { data: registri } = await supabase
      .from("registri_giornalieri")
      .select("username")
      .gte("data", today);

    const compilati = new Set(registri?.map(r => r.username));

    const mancanti =
      autisti?.filter(a => !compilati.has(a.username)) || [];

    return res.status(200).json({
      ok: true,
      mancanti,
    });

  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
    });
  }
}