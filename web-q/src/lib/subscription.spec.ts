import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubscriptionService } from './subscription.js';

describe('Subscription Service', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-20T12:00:00Z'));
    });

    it('should default to FREE plan', () => {
        expect(SubscriptionService.getCurrentPlan()).toBe('FREE');
    });

    it('should upgrade to PRO', () => {
        SubscriptionService.setPlan('PRO');
        expect(SubscriptionService.getCurrentPlan()).toBe('PRO');
    });

    it('should enforce limits for FREE plan on premium models', () => {
        const canAccess = SubscriptionService.canUseModel('claude-opus-4-6');
        expect(canAccess).toBe(false);
    });

    it('should allow PRO plan on premium models', () => {
        SubscriptionService.setPlan('PRO');
        const canAccess = SubscriptionService.canUseModel('claude-opus-4-6');
        expect(canAccess).toBe(true);
    });

    it('should enforce monthly token limits for FREE plan', () => {
        // Free gets 5,000 tokens per month
        expect(SubscriptionService.incrementTokenCount(4000)).toBe(true);
        expect(SubscriptionService.incrementTokenCount(2000)).toBe(false); // Exceeds 5k
    });

    it('should reset limits the next month', () => {
        expect(SubscriptionService.incrementTokenCount(5000)).toBe(true);
        expect(SubscriptionService.canQuery(100)).toBe(false);

        // Fast forward to next month
        vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));
        
        expect(SubscriptionService.canQuery(100)).toBe(true);
        expect(SubscriptionService.incrementTokenCount(100)).toBe(true);
    });
});