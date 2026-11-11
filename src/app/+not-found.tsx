// An address the app doesn't have: Today, rather than a dead end.
import { Redirect } from "expo-router";

export default function NotFound() {
  return <Redirect href="/" />;
}
