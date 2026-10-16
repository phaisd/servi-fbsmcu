import { redirect } from "next/navigation";

export default async function AttendanceScanRedirectPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      params.set(key, value[0]);
    }
  }

  redirect(`/portal/attendance/scan?${params.toString()}`);
}
