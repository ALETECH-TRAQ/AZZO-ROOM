import AuthScreen from "@/components/auth/AuthScreen";
export default function HomePage() {
  return <AuthScreen demoEnabled={process.env.NODE_ENV === "development"} />;
}
