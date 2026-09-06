"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { PillarSelection, ContributionPillar } from "@/components/recording/PillarSelection";
import { WordRecordingStudio } from "@/components/recording/WordRecordingStudio";
import { SentenceRecordingStudio } from "@/components/recording/SentenceRecordingStudio";
import { RecordingChecklist } from "@/components/recording/RecordingChecklist";

export const ContributeClientPage: React.FC = () => {
  const t = useTranslations("contribute");
  const [pillar, setPillar] = useState<ContributionPillar | null>(null);
  const [isEnvironmentVerified, setIsEnvironmentVerified] = useState<boolean>(false);

  // Step 1: Select Pillar (Dictionary vs AI Sentences)
  if (!pillar) {
    return (
      <PillarSelection
        onSelectPillar={(selected) => {
          setPillar(selected);
        }}
      />
    );
  }

  // Step 2: Quality & Environment Pre-Check before entering the studio
  if (!isEnvironmentVerified) {
    return (
      <RecordingChecklist
        formatLabel={pillar === "dictionary" ? t("dictionaryPillarTitle") : t("sentencesPillarTitle")}
        onBack={() => setPillar(null)}
        onReady={() => setIsEnvironmentVerified(true)}
      />
    );
  }

  // Step 3: Direct continuous recording studio
  if (pillar === "dictionary") {
    return (
      <WordRecordingStudio
        onBack={() => {
          setPillar(null);
          setIsEnvironmentVerified(false);
        }}
      />
    );
  }

  return (
    <SentenceRecordingStudio
      onBack={() => {
        setPillar(null);
        setIsEnvironmentVerified(false);
      }}
    />
  );
};
