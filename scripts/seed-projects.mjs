import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Starting seeding projects...");

  // Get a PMO profile to assign as pmo_id
  const { data: pmoProfiles, error: pmoError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "pmo")
    .limit(1);

  if (pmoError || !pmoProfiles || pmoProfiles.length === 0) {
    console.error("Could not find a PMO profile. Seed script needs at least one PMO.");
    process.exit(1);
  }
  const pmoId = pmoProfiles[0].id;

  // Get some Project Manager profiles
  const { data: pmProfiles, error: pmError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "project_manager");

  if (pmError || !pmProfiles || pmProfiles.length === 0) {
    console.error("Could not find a Project Manager profile. Seed script needs at least one PM.");
    process.exit(1);
  }

  const projectsToInsert = [
    {
      code: "PRJ-001",
      name: "Nelsa web development",
      description: "Complete overhaul of the Nelsa e-commerce platform.",
      status: "Completed",
      start_date: "2023-01-15",
      end_date: "2023-05-25",
      pmo_id: pmoId,
      pm_id: pmProfiles[0 % pmProfiles.length].id,
    },
    {
      code: "PRJ-002",
      name: "Datascale AI app",
      description: "AI data analytics mobile application.",
      status: "Delayed",
      start_date: "2023-03-01",
      end_date: "2023-06-20",
      pmo_id: pmoId,
      pm_id: pmProfiles[1 % pmProfiles.length].id,
    },
    {
      code: "PRJ-003",
      name: "Media channel branding",
      description: "Rebranding for major media channel.",
      status: "At risk",
      start_date: "2023-04-10",
      end_date: "2023-07-13",
      pmo_id: pmoId,
      pm_id: pmProfiles[2 % pmProfiles.length].id,
    },
    {
      code: "PRJ-004",
      name: "Corlax iOS app development",
      description: "Native iOS app for Corlax services.",
      status: "Completed",
      start_date: "2023-06-01",
      end_date: "2023-12-20",
      pmo_id: pmoId,
      pm_id: pmProfiles[3 % pmProfiles.length].id,
    },
    {
      code: "PRJ-005",
      name: "Website builder development",
      description: "No-code website builder tool.",
      status: "On going",
      start_date: "2024-01-05",
      end_date: "2024-03-15",
      pmo_id: pmoId,
      pm_id: pmProfiles[0 % pmProfiles.length].id,
    }
  ];

  const { data, error } = await supabase.from("projects").insert(projectsToInsert).select();

  if (error) {
    console.error("Error seeding projects:", error);
  } else {
    console.log("Successfully seeded projects:");
    console.log(data);
  }
}

seed();
