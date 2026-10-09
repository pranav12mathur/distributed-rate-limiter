
import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const accepted = new Counter("accepted_requests");
const limited = new Counter("rate_limited_requests");
const unexpected = new Counter("unexpected_responses");

http.setResponseCallback(http.expectedStatuses(200, 429));

export const options = {
  scenarios: {
    sustained_load: {
      executor: "constant-vus",
      vus: 20,
      duration: "30s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<250", "p(99)<500"],
    http_req_failed: ["rate<0.01"],
    unexpected_responses: ["count==0"],
  },
};

export default function () {
  const response = http.get(
    `${__ENV.BASE_URL || "http://localhost:8080"}/api`,
    {
      headers: {
        "x-api-key": __ENV.API_KEY || "demo-key-1",
      },
    }
  );

  if (response.status === 200) {
    accepted.add(1);
  } else if (response.status === 429) {
    limited.add(1);
  } else {
    unexpected.add(1);
  }

  check(response, {
    "status is 200 or 429": (r) =>
      r.status === 200 || r.status === 429,
  });
}
