import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/agents/cm/")({
  beforeLoad: () => { throw redirect({ to: "/agents/cm/idees" }); },
});
