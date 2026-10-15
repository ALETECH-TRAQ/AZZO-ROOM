import AuthScreen from "@/components/auth/AuthScreen";
export default function Page() {
  return (
    <AuthScreen
      initialMode="signup"
      demoEnabled={process.env.NODE_ENV === "development"}
    />
  );
}
