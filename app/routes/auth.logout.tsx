import { redirect } from "react-router";
import type { Route } from "./+types/auth.logout";
import { getSession, destroySession } from "~/services/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
