import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Starting seeding tasks...");

  // Get a project
  const { data: projects, error: pError } = await supabase.from("projects").select("id").limit(1);
  if (pError || !projects || projects.length === 0) {
    console.error("No projects found. Please seed projects first.");
    process.exit(1);
  }
  const projectId = projects[0].id;

  // Get some users for assignment
  const { data: users, error: uError } = await supabase.from("profiles").select("id, full_name").limit(3);
  if (uError || !users || users.length === 0) {
    console.error("No users found.");
    process.exit(1);
  }

  const tasksToInsert = [
    {
      project_id: projectId,
      name: "Design Database Schema",
      status: "To Do",
      progress: 0,
      planned_start: "2023-01-05",
      planned_end: "2023-01-10",
      owner_id: users[0].id
    },
    {
      project_id: projectId,
      name: "Setup Supabase Auth",
      status: "In Progress",
      progress: 50,
      planned_start: "2023-01-10",
      planned_end: "2023-01-15",
      owner_id: users[1 % users.length].id
    },
    {
      project_id: projectId,
      name: "Create Figma Prototypes",
      status: "Completed",
      progress: 100,
      planned_start: "2023-01-01",
      planned_end: "2023-01-07",
      owner_id: users[2 % users.length].id
    },
    {
      project_id: projectId,
      name: "Develop Kanban UI",
      status: "In Progress",
      progress: 20,
      planned_start: "2023-01-15",
      planned_end: "2023-01-20",
      owner_id: users[0].id
    },
    {
      project_id: projectId,
      name: "Write Unit Tests",
      status: "To Do",
      progress: 0,
      planned_start: "2023-01-20",
      planned_end: "2023-01-25",
      owner_id: users[1 % users.length].id
    }
  ];

  const { data, error } = await supabase.from("tasks").insert(tasksToInsert).select();

  if (error) {
    console.error("Error seeding tasks:", error);
  } else {
    console.log("Successfully seeded tasks:");
    console.log(data);
  }
}

seed();
