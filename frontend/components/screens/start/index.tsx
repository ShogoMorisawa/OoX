"use client";

import { Quicksand } from "next/font/google";

import StartMobile from "./StartMobile";
import StartPC from "./StartPC";
import { useIsMobile } from "@/hooks/useIsMobile";

type Props = {
  onStart: () => void;
};

export type StartViewProps = {
  onStart: () => void;
  titleClassName: string;
};

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function StartScreenContainer({ onStart }: Props) {
  const isMobile = useIsMobile();
  const viewProps: StartViewProps = {
    onStart,
    titleClassName: quicksand.className,
  };

  return isMobile ? (
    <StartMobile {...viewProps} />
  ) : (
    <StartPC {...viewProps} />
  );
}
