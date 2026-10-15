import AvatarEditor from "@/components/avatar/AvatarEditor";
export default function Page() {
  return <AvatarEditor demoEnabled={process.env.NODE_ENV === "development"} />;
}
