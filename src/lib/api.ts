export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://bhavishya.site"
).replace(/\/$/, "");

export const DEMO_API_BASE_URL = API_BASE_URL === "https://bhavishya.site"
  ? "https://www.bhavishya.site"
  : API_BASE_URL;

export type Plan = {
  key: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  dailyCreditLimit: number;
  description: string;
  atsResumeLimit: number;
  linkedinApplications: number;
  naukriApplications: number;
  applicationsUnlimited?: boolean;
  dailyApplicationLimit?: number;
  creditCosts: Record<"chat" | "screenshot" | "microphone" | "system-audio", number>;
};

const CREDIT_COSTS: Plan["creditCosts"] = { chat: 2, screenshot: 4, microphone: 2, "system-audio": 2 };
export const LAUNCH_PLANS: Plan[] = [
  { key: "trial", name: "One-day Trial", price: 10, currency: "INR", durationDays: 1, dailyCreditLimit: 100, description: "Test SmartyAI for one focused interview day.", atsResumeLimit: 1, linkedinApplications: 0, naukriApplications: 0, creditCosts: CREDIT_COSTS },
  { key: "weekly", name: "Interview Week", price: 499, currency: "INR", durationDays: 7, dailyCreditLimit: 200, description: "Focused preparation and live support for interview week.", atsResumeLimit: 1, linkedinApplications: 0, naukriApplications: 0, creditCosts: CREDIT_COSTS },
  { key: "monthly", name: "Notice Period", price: 1999, currency: "INR", durationDays: 30, dailyCreditLimit: 500, description: "Daily practice and interview support throughout your notice period.", atsResumeLimit: 10, linkedinApplications: 10, naukriApplications: 20, creditCosts: CREDIT_COSTS },
  { key: "jobseeker", name: "Job Seeker", price: 9999, currency: "INR", durationDays: 90, dailyCreditLimit: 10000, description: "High-volume preparation and job-search support for active candidates.", atsResumeLimit: 50, linkedinApplications: 100, naukriApplications: 100, applicationsUnlimited: true, dailyApplicationLimit: 20, creditCosts: CREDIT_COSTS },
];

export type Payment = {
  status: "pending" | "paid" | "trial" | "failed";
  planKey: string;
  amount: number;
  currency: string;
  provider: string;
  paidAt: string | null;
  receiptId: string;
};

export type Account = {
  id: string;
  email: string;
  name: string;
  plan: string;
  apiKey: string | null;
  payment?: Payment;
  creditsUsed: number;
  creditsRemaining: number;
  dailyCreditLimit: number;
  creditDay: string;
  creditCosts: Plan["creditCosts"];
  atsOptimizationsUsed: number;
  atsOptimizationsRemaining: number;
  isAdmin?: boolean;
  isAuthenticated?: boolean;
};

export type AuthResponse = {
  success: boolean;
  token: string;
  apiKey: string;
  user: Account;
};

function nonNegativeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function normalizeAccount(account: Partial<Account>): Account {
  const plan = LAUNCH_PLANS.find(candidate => candidate.key === account.plan) || LAUNCH_PLANS[0];
  const dailyCreditLimit = nonNegativeNumber(account.dailyCreditLimit, plan.dailyCreditLimit);
  const creditsUsed = nonNegativeNumber(account.creditsUsed, 0);
  const atsOptimizationsUsed = nonNegativeNumber(account.atsOptimizationsUsed, 0);

  return {
    id: account.id || "",
    email: account.email || "",
    name: account.name || "",
    plan: account.plan || plan.key,
    apiKey: account.apiKey || null,
    payment: account.payment,
    creditsUsed,
    creditsRemaining: nonNegativeNumber(account.creditsRemaining, Math.max(0, dailyCreditLimit - creditsUsed)),
    dailyCreditLimit,
    creditDay: account.creditDay || new Date().toISOString().slice(0, 10),
    creditCosts: account.creditCosts || plan.creditCosts,
    atsOptimizationsUsed,
    atsOptimizationsRemaining: nonNegativeNumber(
      account.atsOptimizationsRemaining,
      Math.max(0, plan.atsResumeLimit - atsOptimizationsUsed),
    ),
    isAdmin: account.isAdmin === true,
    isAuthenticated: account.isAuthenticated,
  };
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type ProfileContext = {
  resume: {
    data: { [key: string]: JsonValue };
    source: string;
    syncedAt: string | null;
  } | null;
  jobDescription: {
    text: string;
    syncedAt: string | null;
  } | null;
  atsDraft: {
    data: { [key: string]: JsonValue };
    jobDescription: string;
    updatedAt: string | null;
  } | null;
  customInstructions: string;
  updatedAt: string | null;
};

const TOKEN_KEY = "smartyai_access_token";
const TUNNEL_HEADERS = { "X-Tunnel-Skip-Anti-Phishing-Page": "true" };

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...TUNNEL_HEADERS,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`Cannot reach the SmartyAI service at ${API_BASE_URL}. Check that the backend is running and the API URL is correct.`);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (payload as { error?: { message?: string }; message?: string }).error?.message || (payload as { message?: string }).message || "Request failed";
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export async function getPlans(): Promise<Plan[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/plans`, {
      headers: TUNNEL_HEADERS,
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { plans?: Plan[] };
    const plans = Array.isArray(payload.plans) ? payload.plans : [];
    return plans.length === LAUNCH_PLANS.length && plans.every(plan => Number.isFinite(plan.dailyCreditLimit))
      ? plans
      : LAUNCH_PLANS;
  } catch {
    return LAUNCH_PLANS;
  }
}