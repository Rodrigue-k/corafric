"use client";

import React, { useState } from "react";
import { PillarSelection, ContributionPillar } from "@/components/recording/PillarSelection";
import { WordRecordingStudio } from "@/components/recording/WordRecordingStudio";
import { SentenceRecordingStudio } from "@/components/recording/SentenceRecordingStudio";
import { RecordingChecklist } from "@/components/recording/RecordingChecklist";

export const ContributeClientPage: React.FC = () => {
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
        formatLabel={pillar === "dictionary" ? "Dictionnaire Vocal" : "Corpus de Phrases IA"}
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
