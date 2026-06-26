import { redirect } from "next/navigation";

// This route was an unreachable, fully-mocked task submission screen (no API
// wired up). Task submission happens through the capture → location flow.
// Redirect to the dashboard so the mock UI is never shown.
export default function SubmitTask() {
  redirect("/executor/dashboard");
}
