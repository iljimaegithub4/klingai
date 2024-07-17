import { taskStatusResSchema, taskSubmitResSchema, taskSubmitSchema } from "../types";
import { z } from "zod";
import { defer, delay, map, retry, tap, timer } from "rxjs";
import fetch from "node-fetch";

const submitAPI = "https://klingai.kuaishou.com/api/task/submit";
const statusAPI = "https://klingai.kuaishou.com/api/task/status";

export async function submit(task: z.infer<typeof taskSubmitSchema>, cookie: string) {
  const res = await fetch(submitAPI, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(task),
  });

  return (await res.json()) as z.infer<typeof taskSubmitResSchema>;
}

export async function status(taskId: string, cookie: string) {
  const res = await fetch(statusAPI + `?taskId=${taskId}`, {
    headers: {
      Cookie: cookie,
    },
  });

  return (await res.json()) as z.infer<typeof taskStatusResSchema>;
}

export function checkStatusUntilDone(
  taskId: string,
  cookie: string,
  callback: (v: z.infer<typeof taskStatusResSchema>) => void,
) {
  return defer(() => status(taskId, cookie)).pipe(
    tap((res) => callback(res)),
    map((res) => {
      if (res.status === 200 && res.data.status >= 90) {
        return res;
      }
      throw new Error("Task is not done yet");
    }),
    delay(3000),
    retry({
      count: 10,
      delay: (error, b) => timer((2 ^ (b + 1)) * 1000),
    }),
  );
}
