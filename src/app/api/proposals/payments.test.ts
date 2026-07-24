import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as paySurveyPost } from './[id]/pay-survey/route';
import { POST as verifySurveyPost } from './[id]/verify-survey/route';
import { POST as payDepositPost } from './[id]/pay-deposit/route';
import { POST as verifyDepositPost } from './[id]/verify-deposit/route';
import { POST as financeApplyPost } from '../finance/apply/route';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.stubEnv('PAYSTACK_SECRET_KEY', 'mock');

describe('Payments & Monetization Integration API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    (createServerClient as any).mockResolvedValue(mockSupabase);
    (createSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  describe('Survey Payments', () => {
    it('initializes a pay-survey transaction successfully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'prop-123',
          final_quoted_price_ngn: 2000000,
          calculations_snapshot: {
            surveyFee: 15000,
            offerInsurance: true,
          },
        },
        error: null,
      });

      const request = new Request('http://localhost/api/proposals/prop-123/pay-survey', {
        method: 'POST',
        body: JSON.stringify({
          email: 'customer@example.com',
          includeInsurance: true,
        }),
      });

      const response = await paySurveyPost(request, { params: Promise.resolve({ id: 'prop-123' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.authorization_url).toBeDefined();
    });

    it('verifies a survey payment successfully and updates DB state', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: 'prop-123',
            final_quoted_price_ngn: 2000000,
            calculations_snapshot: {
              surveyFee: 15000,
              offerInsurance: true,
            },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'prop-123',
            tracking_status: 'Approved',
            calculations_snapshot: {
              surveyFee: 15000,
              surveyPaid: true,
              paystackRef: 'ref-123',
              insurancePaid: true,
              insurancePremium: 40000,
              warrantyCert: 'SQP-SHIELD-REF-123',
            },
          },
          error: null,
        });

      const request = new Request('http://localhost/api/proposals/prop-123/verify-survey', {
        method: 'POST',
        body: JSON.stringify({
          reference: 'ref-123',
          includeInsurance: true,
        }),
      });

      const response = await verifySurveyPost(request, { params: Promise.resolve({ id: 'prop-123' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.proposal.calculations_snapshot.surveyPaid).toBe(true);
      expect(json.proposal.calculations_snapshot.insurancePaid).toBe(true);
      expect(json.proposal.calculations_snapshot.warrantyCert).toBeDefined();
    });
  });

  describe('Deposit Payments', () => {
    it('initializes a pay-deposit transaction successfully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'prop-123',
          final_quoted_price_ngn: 4000000,
          calculations_snapshot: {
            paymentPlan: {
              selectedPlan: 'outright',
            },
          },
        },
        error: null,
      });

      const request = new Request('http://localhost/api/proposals/prop-123/pay-deposit', {
        method: 'POST',
        body: JSON.stringify({
          email: 'client@example.com',
          paymentType: 'deposit',
        }),
      });

      const response = await payDepositPost(request, { params: Promise.resolve({ id: 'prop-123' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.authorization_url).toBeDefined();
      expect(json.authorization_url).toContain('payment=deposit_success');
    });

    it('verifies deposit payment and automatically routes supplier referral commission', async () => {
      // Mock fetching proposal and updated proposal
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: 'prop-123',
            final_quoted_price_ngn: 4000000,
            company_id: 'comp-111',
            installer_id: 'user-222',
            customer_name: 'Adewale Lagos Project',
            calculations_snapshot: {
              inverterKva: 5,
              batteryConfigString: '4.8kWh Lithium',
              panelCount: 6,
            },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'prop-123',
            tracking_status: 'Approved',
            calculations_snapshot: {
              depositPaid: true,
              depositRef: 'ref-dep-123',
              depositAmount: 2000000,
            },
          },
          error: null,
        });

      // Mock supplier partners query
      mockSupabase.limit.mockResolvedValueOnce({
        data: [
          {
            id: 'supplier-abc',
            name: 'Wandel International',
            commission_model: 'percentage_of_sale',
            commission_rate: 2.5,
            active: true,
          },
        ],
        error: null,
      });

      const request = new Request('http://localhost/api/proposals/prop-123/verify-deposit', {
        method: 'POST',
        body: JSON.stringify({
          reference: 'ref-dep-123',
          paymentType: 'deposit',
        }),
      });

      const response = await verifyDepositPost(request, { params: Promise.resolve({ id: 'prop-123' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.proposal.calculations_snapshot.depositPaid).toBe(true);

      // Verify supplier referrals table was inserted with calculated commission (2.5% of 4,000,000 = 100,000)
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          proposal_id: 'prop-123',
          preferred_supplier_id: 'supplier-abc',
          expected_commission: 100000,
          status: 'new',
        })
      );
    });
  });

  describe('FinTech Loan Application', () => {
    it('applies for financing and auto-approves if DTI is healthy', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: 'prop-123',
            final_quoted_price_ngn: 3000000,
            calculations_snapshot: {},
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'prop-123',
            tracking_status: 'Approved',
            calculations_snapshot: {
              financeApplication: {
                status: 'Approved',
                lender: 'Sterling Bank',
              },
            },
          },
          error: null,
        });

      const request = new Request('http://localhost/api/finance/apply', {
        method: 'POST',
        body: JSON.stringify({
          proposalId: 'prop-123',
          monthlyIncome: 800000,
          employmentStatus: 'salaried',
          preferredLender: 'Sterling Bank',
          termMonths: 12,
          downPayment: 600000,
          financedAmount: 2400000,
        }),
      });

      const response = await financeApplyPost(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe('Approved');
      expect(json.proposal.calculations_snapshot.financeApplication.status).toBe('Approved');
    });

    it('requires manual review if DTI is dangerously high (> 55%)', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: 'prop-123',
            final_quoted_price_ngn: 3000000,
            calculations_snapshot: {},
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'prop-123',
            tracking_status: 'Sent',
            calculations_snapshot: {
              financeApplication: {
                status: 'Pending_Review',
              },
            },
          },
          error: null,
        });

      const request = new Request('http://localhost/api/finance/apply', {
        method: 'POST',
        body: JSON.stringify({
          proposalId: 'prop-123',
          monthlyIncome: 300000, // Very low income compared to loan size
          employmentStatus: 'self_employed',
          preferredLender: 'CredPal',
          termMonths: 12,
          downPayment: 300000,
          financedAmount: 2700000,
        }),
      });

      const response = await financeApplyPost(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe('Pending_Review');
    });
  });
});
