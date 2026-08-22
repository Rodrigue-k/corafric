import React from "react";
import ProfileClientPage from "./ProfileClientPage";

export const metadata = {
  title: "Mon Profil — Corafric",
  description: "Vos statistiques de contribution et vos récompenses sur Corafric.",
};

export default async function ProfilePage() {
  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-140px)]">
      <ProfileClientPage />
    </div>
  );
}
