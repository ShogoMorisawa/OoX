"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import ResultMobile from "./ResultMobile";
import ResultPC from "./ResultPC";
import { CalculateResponse, DescribeResponse, FunctionCode } from "@/types/oox";
import { getIcon } from "@/constants/icons";

type Props = {
  calculateResult: CalculateResponse;
  describeResult: DescribeResponse;
  onGoToWorld: () => void;
};

export type ResultViewProps = {
  calculateResult: CalculateResponse;
  describeResult: DescribeResponse;
  onGoToWorld: () => void;
  iconUrl: string;
};

export default function ResultContainer(props: Props) {
  const isMobile = useIsMobile();
  const finalOrder = props.calculateResult.order.flat() as FunctionCode[];
  const dominantFunction = finalOrder[0];
  const iconUrl = getIcon(dominantFunction, finalOrder[1]);

  return isMobile ? (
    <ResultMobile {...props} iconUrl={iconUrl} />
  ) : (
    <ResultPC {...props} iconUrl={iconUrl} />
  );
}
