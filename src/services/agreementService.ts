import { Agreement, Payment, PaymentInput } from '@/types/models';
import { supabase } from '@/lib/supabase';

type AgreementRow = {
  id: string;
  lender_id: string;
  borrower_id: string | null;
  borrower_phone: string | null;
  borrower_email: string | null;
  borrower_name: string | null;
  principal_amount: number | string;
  interest_rate: number | string | null;
  interest_amount: number | string;
  total_repayment_amount: number | string;
  number_of_payments: number;
  payment_frequency: Agreement['paymentFrequency'];
  start_date: string;
  due_date: string;
  notes: string | null;
  status: Agreement['status'];
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  next_payment_date: string | null;
  scheduled_payments?: ScheduledPaymentRow[];
};

type ScheduledPaymentRow = {
  payment_number: number;
  due_date: string;
  amount: number | string;
  status: NonNullable<Agreement['paymentSchedule']>[number]['status'];
};

type PaymentRow = {
  id: string;
  agreement_id: string;
  payer_id: string;
  receiver_id: string;
  amount: number | string;
  payment_date: string;
  method: Payment['method'];
  notes: string | null;
  status: Payment['status'];
  created_at: string;
  confirmed_at: string | null;
  rejected_at: string | null;
};

const asNumber = (value: number | string | null | undefined) => Number(value || 0);

const toAgreementRow = (agreement: Agreement) => ({
  id: agreement.id,
  lender_id: agreement.lenderId,
  borrower_id: agreement.borrowerId,
  borrower_phone: agreement.borrowerPhone,
  borrower_email: agreement.borrowerEmail,
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

const fromAgreementRow = (row: AgreementRow): Agreement => ({
  id: row.id,
  lenderId: row.lender_id,
  borrowerId: row.borrower_id || undefined,
  borrowerPhone: row.borrower_phone || '',
  borrowerEmail: row.borrower_email || undefined,
  borrowerName: row.borrower_name || undefined,
  principalAmount: asNumber(row.principal_amount),
  interestRate: row.interest_rate === null ? undefined : asNumber(row.interest_rate),
  interestAmount: asNumber(row.interest_amount),
  totalRepaymentAmount: asNumber(row.total_repayment_amount),
  numberOfPayments: row.number_of_payments,
  paymentFrequency: row.payment_frequency,
  startDate: row.start_date,
  dueDate: row.due_date,
  notes: row.notes || undefined,
  status: row.status,
  createdAt: row.created_at,
  acceptedAt: row.accepted_at || undefined,
  completedAt: row.completed_at || undefined,
  nextPaymentDate: row.next_payment_date || undefined,
  paymentSchedule: row.scheduled_payments
    ?.sort((a, b) => a.payment_number - b.payment_number)
    .map((payment) => ({
      payment_number: payment.payment_number,
      due_date: payment.due_date,
      amount: asNumber(payment.amount),
      status: payment.status,
    })),
});

const fromPaymentRow = (row: PaymentRow): Payment => ({
  id: row.id,
  agreementId: row.agreement_id,
  payerId: row.payer_id,
  receiverId: row.receiver_id,
  amount: asNumber(row.amount),
  paymentDate: row.payment_date,
  method: row.method,
  notes: row.notes || undefined,
  status: row.status,
  createdAt: row.created_at,
  confirmedAt: row.confirmed_at || undefined,
  rejectedAt: row.rejected_at || undefined,
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
    const [{ data: agreementRows, error: agreementError }, { data: paymentRows, error: paymentError }] = await Promise.all([
      supabase
        .from('agreements')
        .select('*, scheduled_payments(payment_number, due_date, amount, status)')
        .order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
    ]);

    if (agreementError) throw agreementError;
    if (paymentError) throw paymentError;

    return {
      agreements: ((agreementRows || []) as AgreementRow[]).map(fromAgreementRow),
      payments: ((paymentRows || []) as PaymentRow[]).map(fromPaymentRow),
    };
  },
};
