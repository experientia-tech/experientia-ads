import { redirect } from "next/navigation";

// This route previously rendered a hardcoded mock task list. The real executor
// flow runs through the dashboard → campaign → task capture. Redirect here so
// the mock UI is never shown.
export default function TasksPage() {
  redirect("/executor/dashboard");
}
