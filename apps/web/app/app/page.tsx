import OfficeApp from "@/components/OfficeApp";
export default function Page() {
  return <OfficeApp demoEnabled={process.env.NODE_ENV === "development"} />;
}
