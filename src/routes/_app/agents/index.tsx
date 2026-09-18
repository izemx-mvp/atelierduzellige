import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/agents/")({
  beforeLoad: () => { throw redirect({ to: "/agents/activite" }); },
});
