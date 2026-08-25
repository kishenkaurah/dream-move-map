import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/thailand-call")({
  component: () => <Outlet />,
});
