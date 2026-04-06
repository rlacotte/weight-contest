/**
 * Withings API integration
 * Docs: https://developer.withings.com/api-reference
 */

const WITHINGS_AUTH_URL = "https://account.withings.com/oauth2_user/authorize2";
const WITHINGS_API_URL = "https://wbsapi.withings.net";

export interface WithingsTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  userid: string;
  scope: string;
}

export interface WithingsMeasurement {
  weight: number; // in kg
  date: Date;
  body_fat_pct: number | null;
  muscle_mass: number | null;
  water_pct: number | null;
}

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.WITHINGS_CLIENT_ID!,
    scope: "user.metrics",
    redirect_uri: getRedirectUri(),
    state,
  });
  return `${WITHINGS_AUTH_URL}?${params.toString()}`;
}

export function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/api/health/withings/callback`;
}

export async function exchangeCodeForTokens(code: string): Promise<WithingsTokens> {
  const body = new URLSearchParams({
    action: "requesttoken",
    grant_type: "authorization_code",
    client_id: process.env.WITHINGS_CLIENT_ID!,
    client_secret: process.env.WITHINGS_CLIENT_SECRET!,
    code,
    redirect_uri: getRedirectUri(),
  });

  const res = await fetch(`${WITHINGS_API_URL}/v2/oauth2`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  if (data.status !== 0) {
    throw new Error(`Withings auth error: ${data.error ?? "unknown"}`);
  }
  return data.body as WithingsTokens;
}

export async function refreshTokens(refreshToken: string): Promise<WithingsTokens> {
  const body = new URLSearchParams({
    action: "requesttoken",
    grant_type: "refresh_token",
    client_id: process.env.WITHINGS_CLIENT_ID!,
    client_secret: process.env.WITHINGS_CLIENT_SECRET!,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${WITHINGS_API_URL}/v2/oauth2`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  if (data.status !== 0) {
    throw new Error(`Withings refresh error: ${data.error ?? "unknown"}`);
  }
  return data.body as WithingsTokens;
}

/**
 * Fetch body measurements from Withings.
 * meastype: 1=weight, 6=body fat %, 76=muscle mass, 77=hydration
 */
export async function fetchMeasurements(
  accessToken: string,
  lastupdate?: Date
): Promise<WithingsMeasurement[]> {
  const params = new URLSearchParams({
    action: "getmeas",
    meastypes: "1,6,76,77",
    category: "1", // real measurements only
  });

  if (lastupdate) {
    params.set("lastupdate", Math.floor(lastupdate.getTime() / 1000).toString());
  } else {
    // Fetch last 90 days by default
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    params.set("startdate", Math.floor(ninetyDaysAgo.getTime() / 1000).toString());
    params.set("enddate", Math.floor(Date.now() / 1000).toString());
  }

  const res = await fetch(`${WITHINGS_API_URL}/measure?${params.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  if (data.status !== 0) {
    throw new Error(`Withings measure error: ${data.error ?? data.status}`);
  }

  const measureGroups = data.body?.measuregrps ?? [];

  return measureGroups
    .map((grp: any) => {
      const measurement: WithingsMeasurement = {
        weight: 0,
        date: new Date(grp.date * 1000),
        body_fat_pct: null,
        muscle_mass: null,
        water_pct: null,
      };

      for (const m of grp.measures) {
        const value = m.value * Math.pow(10, m.unit);
        switch (m.type) {
          case 1:
            measurement.weight = value;
            break;
          case 6:
            measurement.body_fat_pct = value;
            break;
          case 76:
            measurement.muscle_mass = value;
            break;
          case 77:
            measurement.water_pct = value;
            break;
        }
      }

      return measurement;
    })
    .filter((m: WithingsMeasurement) => m.weight > 0);
}
