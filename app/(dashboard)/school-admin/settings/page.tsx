import { getSchoolProfile } from "@/db/queries/Admin";
import { SettingsClient } from "./_components/SettingsClient";

export default async function SettingsPage() {
  const school = await getSchoolProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Manage your school profile and system configuration.
        </p>
      </div>
      <SettingsClient school={school ?? null} />
    </div>
  );
}
