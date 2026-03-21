"use client";

import { useTranslations } from "next-intl";

export default function AdminPage() {
  const t = useTranslations("nav");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("admin")}</h1>
      <p className="text-muted">Admin panel — manage gathers, promote users.</p>
      {/* TODO: Admin functionality */}
      <div className="bg-surface rounded-lg p-6 border border-border text-center text-muted">
        Coming soon
      </div>
    </div>
  );
}
