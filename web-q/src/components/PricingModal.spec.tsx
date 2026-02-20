import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PricingModal from './PricingModal';
import { SubscriptionService } from '../lib/subscription';

vi.mock('../lib/subscription');

describe('PricingModal Component', () => {
    it('should not render when isOpen is false', () => {
        render(<PricingModal isOpen={false} onClose={() => {}} />);
        expect(screen.queryByText('Pricing & Plans')).toBeNull();
    });

    it('should render pricing tiers when open', () => {
        render(<PricingModal isOpen={true} onClose={() => {}} />);
        expect(screen.getByText('Free')).toBeDefined();
        expect(screen.getByText('Pro')).toBeDefined();
        expect(screen.getByText('Enterprise')).toBeDefined();
    });

    it('should toggle between Monthly and Annual pricing', () => {
        render(<PricingModal isOpen={true} onClose={() => {}} />);
        expect(screen.getByText('$20/mo')).toBeDefined(); // Monthly view default

        const annualToggle = screen.getByLabelText('Annual Billing (Save 20%)');
        fireEvent.click(annualToggle);

        expect(screen.getByText('$200/yr')).toBeDefined(); // Annual view
    });

    it('should display correct CTAs', () => {
        vi.mocked(SubscriptionService.getCurrentPlan).mockReturnValue('FREE');
        render(<PricingModal isOpen={true} onClose={() => {}} />);
        
        expect(screen.getByText('Current Plan')).toBeDefined(); // Free is active
        expect(screen.getByText('Go Pro')).toBeDefined(); // Pro is inactive
        expect(screen.getByText('Contact Sales')).toBeDefined(); // Enterprise is inactive
    });

    it('should call SubscriptionService on upgrade action', () => {
        vi.mocked(SubscriptionService.getCurrentPlan).mockReturnValue('FREE');
        
        window.alert = vi.fn(); // Mock alert

        render(<PricingModal isOpen={true} onClose={() => {}} />);
        
        const upgradeProBtn = screen.getByTestId('upgrade-PRO');
        fireEvent.click(upgradeProBtn);

        expect(SubscriptionService.setPlan).toHaveBeenCalledWith('PRO');
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Redirecting to Stripe'));
    });
});