import { redirect } from "react-router";
import { getAuthUrl } from "~/services/google-auth.server";

export async function loader() {
  const authUrl = getAuthUrl();
  return redirect(authUrl);
}
