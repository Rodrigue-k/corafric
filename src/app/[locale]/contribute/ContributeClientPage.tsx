"use client";

import React, { useState } from "react";
import { PillarSelection, ContributionPillar } from "@/components/recording/PillarSelection";
import { WordRecordingStudio } from "@/components/recording/WordRecordingStudio";
import { SentenceRecordingStudio } from "@/components/recording/SentenceRecordingStudio";

export const ContributeClientPage: React.FC = () => {
  const [pillar, setPillar] = useState<ContributionPillar | null>(null);

  if (!pillar) {
    return <PillarSelection onSelectPillar={(selected) => setPillar(selected)} />;
  }

  if (pillar === "dictionary") {
    return <WordRecordingStudio onBack={() => setPillar(null)} />;
  }

  return <SentenceRecordingStudio onBack={() => setPillar(null)} />;
};
