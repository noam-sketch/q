export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE';

const PREMIUM_MODELS = [
  'claude-opus-4-6',
  'gemini-3-pro-preview',
  'gemini-3.1-pro',
  'gemini-3-pro'
];

interface UsageData {
    month: string;
    tokensUsed: number;
}

export class SubscriptionService {
    private static PLAN_KEY = 'q_user_plan';
    private static USAGE_KEY = 'q_monthly_usage';
    
    // Limits based on approximate tokens
    private static FREE_LIMIT = 5000;
    private static PRO_LIMIT = 1_000_000;

    static getCurrentPlan(): PlanType {
        return (localStorage.getItem(this.PLAN_KEY) as PlanType) || 'FREE';
    }

    static setPlan(plan: PlanType) {
        localStorage.setItem(this.PLAN_KEY, plan);
    }

    static canUseModel(model: string): boolean {
        const plan = this.getCurrentPlan();
        if (plan === 'PRO' || plan === 'ENTERPRISE') return true;
        return !PREMIUM_MODELS.includes(model);
    }

    static getLimitForPlan(plan: PlanType): number {
        if (plan === 'ENTERPRISE') return Infinity;
        if (plan === 'PRO') return this.PRO_LIMIT;
        return this.FREE_LIMIT;
    }

    static canQuery(estimatedTokens: number = 0): boolean {
        const plan = this.getCurrentPlan();
        if (plan === 'ENTERPRISE') return true;

        const usage = this.getCurrentMonthUsage();
        return (usage.tokensUsed + estimatedTokens) <= this.getLimitForPlan(plan);
    }

    static incrementTokenCount(tokens: number): boolean {
        if (!this.canQuery(tokens)) return false;

        const usage = this.getCurrentMonthUsage();
        usage.tokensUsed += tokens;
        localStorage.setItem(this.USAGE_KEY, JSON.stringify(usage));
        return true;
    }

    private static getCurrentMonthUsage(): UsageData {
        const d = new Date();
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const raw = localStorage.getItem(this.USAGE_KEY);
        
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as UsageData;
                if (parsed.month === monthStr) {
                    return parsed;
                }
            } catch {
                // parse error, reset
            }
        }

        return { month: monthStr, tokensUsed: 0 };
    }
}