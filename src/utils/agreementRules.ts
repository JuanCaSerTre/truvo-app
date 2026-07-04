import { Agreement, Payment } from '@/types/models';

export const getConfirmedPayments = (agreementId: string, payments: Payment[]) =>
  payments.filter((payment) => payment.agreementId === agreementId && payment.status === 'confirmed');

export const getPendingPayments = (agreementId: string, payments: Payment[]) =>
  payments.filter((payment) => payment.agreementId === agreementId && payment.status === 'pending_confirmation');

export const getTotalPaid = (agreementId: string, payments: Payment[]) =>
  getConfirmedPayments(agreementId, payments).reduce((sum, payment) => sum + payment.amount, 0);

export const getRemainingBalance = (agreement: Agreement, payments: Payment[]) =>
  Math.max(agreement.totalRepaymentAmount - getTotalPaid(agreement.id, payments), 0);

export const getProgress = (agreement: Agreement, payments: Payment[]) => {
  if (agreement.totalRepaymentAmount <= 0) return 0;
  return Math.min(getTotalPaid(agreement.id, payments) / agreement.totalRepaymentAmount, 1);
};

export const canEditAgreement = (agreement: Agreement) => agreement.status === 'pending';

export const shouldCompleteAgreement = (agreement: Agreement, payments: Payment[]) =>
  agreement.status === 'active' && getRemainingBalance(agreement, payments) <= 0;
