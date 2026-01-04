import { DescribeResponse, FunctionCode, Tier } from "@/types/oox";
import { ApiError, apiRequest } from "./client";

export type JobStatusResponse =
  | { status: "pending" }
  | { status: "completed"; data: DescribeResponse }
  | { status: "failed"; error: string };

export async function startDescribeJob(
  finalOrder: FunctionCode[],
  healthStatus: Record<FunctionCode, "O" | "o" | "x">,
  tierMap: Record<FunctionCode, Tier>
): Promise<string> {
  const data = await apiRequest<{ job_id: string }>("/api/describe", {
    method: "POST",
    body: {
      finalOrder,
      healthStatus,
      tierMap,
    },
  });

  if (!data.job_id) throw new Error("ジョブIDの取得に失敗しました");
  return data.job_id;
}

export async function checkJobStatus(
  jobId: string
): Promise<JobStatusResponse> {
  try {
    return await apiRequest<JobStatusResponse>(`/api/describe/status/${jobId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Error("ジョブが見つかりません");
    }
    throw error;
  }
}
