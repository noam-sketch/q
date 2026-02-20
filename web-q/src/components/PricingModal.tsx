import React, { useState } from 'react';
import { SubscriptionService, PlanType } from '../lib/subscription';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanType>(SubscriptionService.getCurrentPlan());

  if (!isOpen) return null;

  const handleUpgrade = (plan: PlanType) => {
      if (plan === 'PRO') {
          alert(`Redirecting to Stripe Checkout...\n\nPayment Methods: Credit Card (CC) or ACH.\nAmount: ${isAnnual ? '$200/yr' : '$20/mo'}`);
      } else if (plan === 'ENTERPRISE') {
          alert(`Contacting Sales... Please email sales@coherences.io for a custom quote.`);
      } else if (plan === 'FREE') {
          alert(`Your plan has been reverted to the Free Tier.`);
      }
      
      SubscriptionService.setPlan(plan);
      setCurrentPlan(plan);
      onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="pricing-content">
        <h2>Pricing & Plans</h2>
        
        <div className="toggle-container">
          <label>
              <input type="checkbox" checked={isAnnual} onChange={() => setIsAnnual(!isAnnual)} />
              <span className="toggle-text">Annual Billing (Save 20%)</span>
          </label>
        </div>

        <div className="pricing-cards">
            {/* Free Tier */}
            <div className="card">
                <h3>Free</h3>
                <div className="price">$0/mo</div>
                <ul>
                    <li>Basic Access</li>
                    <li>Basic AI Models (Haiku, Flash)</li>
                    <li>~5,000 Tokens / Month</li>
                    <li>Web Interface</li>
                </ul>
                <button 
                  disabled={currentPlan === 'FREE'} 
                  onClick={() => handleUpgrade('FREE')}
                  className={currentPlan === 'FREE' ? 'btn-active' : 'btn-upgrade'}
                >
                  {currentPlan === 'FREE' ? 'Current Plan' : 'Sign Up Free'}
                </button>
            </div>

            {/* Pro Tier */}
            <div className="card pro-card">
                <h3>Pro</h3>
                <div className="price">{isAnnual ? '$200/yr' : '$20/mo'}</div>
                <ul>
                    <li>1,000,000 Tokens / Month</li>
                    <li>Gemini/Claude API Access</li>
                    <li>Premium Models (Opus 4.6, Gemini Pro)</li>
                    <li>Triad Mode Enabled</li>
                    <li>Q-Local Access</li>
                </ul>
                <button 
                  data-testid="upgrade-PRO"
                  disabled={currentPlan === 'PRO'} 
                  onClick={() => handleUpgrade('PRO')}
                  className={currentPlan === 'PRO' ? 'btn-active' : 'btn-upgrade-pro'}
                >
                  {currentPlan === 'PRO' ? 'Current Plan' : 'Go Pro'}
                </button>
            </div>

            {/* Enterprise Tier */}
            <div className="card">
                <h3>Enterprise</h3>
                <div className="price">Custom Quote</div>
                <ul>
                    <li>Unlimited / Custom Token Limits</li>
                    <li>Fleet Management</li>
                    <li>Custom Model Prompts</li>
                    <li>Priority Support</li>
                </ul>
                <button 
                  disabled={currentPlan === 'ENTERPRISE'} 
                  onClick={() => handleUpgrade('ENTERPRISE')}
                  className={currentPlan === 'ENTERPRISE' ? 'btn-active' : 'btn-upgrade'}
                >
                  {currentPlan === 'ENTERPRISE' ? 'Current Plan' : 'Contact Sales'}
                </button>
            </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Close</button>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;