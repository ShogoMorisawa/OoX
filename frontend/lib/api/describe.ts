import { API_BASE_URL } from "@/constants/api";
import { DescribeResponse, FunctionCode, Tier } from "@/types/oox";

export type JobStatusResponse =
  | { status: "pending" }
  | { status: "completed"; data: DescribeResponse }
  | { status: "failed"; error: string };

export async function startDescribeJob(
  finalOrder: FunctionCode[],
  healthStatus: Record<FunctionCode, "O" | "o" | "x">,
  tierMap: Record<FunctionCode, Tier>
): Promise<string> {
  const url = `${API_BASE_URL}/api/describe`;
  const requestBody = { finalOrder, healthStatus, tierMap };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(
      `Describe API error: ${res.status} ${res.statusText}\n${errorText}`
    );
  }

  const { job_id: jobId } = await res.json();
  if (!jobId) throw new Error("ジョブIDの取得に失敗しました");

  return jobId;
}

export async function checkJobStatus(
  jobId: string
): Promise<JobStatusResponse> {
  const url = `${API_BASE_URL}/api/describe/status/${jobId}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("ジョブが見つかりません");
    throw new Error(`Status check failed: ${res.status}`);
  }
  return await res.json();
}
