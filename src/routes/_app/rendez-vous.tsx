import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/rendez-vous")({
  beforeLoad: () => { throw redirect({ to: "/agents/booking" }); },
});
