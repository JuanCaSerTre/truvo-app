import { Agreement, Payment, PaymentInput } from '@/types/models';
import { supabase } from '@/lib/supabase';

const toAgreementRow = (agreement: Agreement) => ({
  id: agreement.id,
  lender_id: agreement.lenderId,
  borrower_id: agreement.borrowerId,
  borrower_phone: agreement.borrowerPhone,
  borrower_name: agreement.borrowerName,
  principal_amount: agreement.principalAmount,
  interest_rate: agreement.interestRate,
  interest_amount: agreement.interestAmount,
  total_repayment_amount: agreement.totalRepaymentAmount,
  number_of_payments: agreement.numberOfPayments,
  payment_frequency: agreement.paymentFrequency,
  start_date: agreement.startDate,
  due_date: agreement.dueDate,
  notes: agreement.notes,
  status: agreement.status,
  created_at: agreement.createdAt,
  accepted_at: agreement.acceptedAt,
  completed_at: agreement.completedAt,
  next_payment_date: agreement.nextPaymentDate,
});

const toPaymentRow = (payment: Payment) => ({
  id: payment.id,
  agreement_id: payment.agreementId,
  payer_id: payment.payerId,
  receiver_id: payment.receiverId,
  amount: payment.amount,
  payment_date: payment.paymentDate,
  method: payment.method,
  notes: payment.notes,
  status: payment.status,
  created_at: payment.createdAt,
  confirmed_at: payment.confirmedAt,
  rejected_at: payment.rejectedAt,
});

export const agreementService = {
  async createAgreement(agreement: Agreement): Promise<Agreement> {
    if (!supabase) {
      console.log('Supabase is not configured yet. Agreement kept in local mock state.', agreement.id);
      return agreement;
    }

    const { error } = await supabase.from('agreements').insert(toAgreementRow(agreement));
    if (error) throw error;

    if (agreement.paymentSchedule?.length) {
      const { error: scheduleError } = await supabase.from('scheduled_payments').insert(
        agreement.paymentSchedule.map((payment) => ({
          agreement_id: agreement.id,
          payment_number: payment.payment_number,
          due_date: payment.due_date,
          amount: payment.amount,
          status: payment.status,
        })),
      );
      if (scheduleError) throw scheduleError;
    }

    return agreement;
  },

  async updateAgreement(agreement: Agreement): Promise<Agreement> {
    if (!supabase) return agreement;
    const { error } = await supabase.from('agreements').update(toAgreementRow(agreement)).eq('id', agreement.id);
    if (error) throw error;
    return agreement;
  },

  async registerPayment(input: PaymentInput): Promise<PaymentInput> {
    console.log('PaymentInput accepted by store; full payment persistence happens after local payment object is created.', input);
    return input;
  },

  async createPayment(payment: Payment): Promise<Payment> {
    if (!supabase) return payment;
    const { error } = await supabase.from('payments').insert(toPaymentRow(payment));
    if (error) throw error;
    return payment;
  },

  async updatePayment(payment: Payment): Promise<Payment> {
    if (!supabase) return payment;
    const { error } = await supabase.from('payments').update(toPaymentRow(payment)).eq('id', payment.id);
    if (error) throw error;
    return payment;
  },

  async syncAgreements(): Promise<{ agreements: Agreement[]; payments: Payment[] }> {
    if (!supabase) {
      console.log('Supabase is not configured yet. Using seed data.');
      return { agreements: [], payments: [] };
    }
    console.log('TODO: map Supabase rows back into app models for startup sync.');
    return { agreements: [], payments: [] };
  },
};
