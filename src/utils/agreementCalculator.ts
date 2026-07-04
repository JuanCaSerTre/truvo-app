import { PaymentFrequency, ScheduledPayment } from '@/types/models';

export type InterestType = 'none' | 'rate' | 'fixed';

export interface AgreementCalculationInput {
  principalAmount?: number;
  paymentFrequency?: PaymentFrequency;
  startDate?: string;
  dueDate?: string;
  paymentAmount?: number;
  numberOfPayments?: number;
  interestRate?: number;
  fixedInterestAmount?: number;
  totalRepaymentAmount?: number;
}

export interface AgreementCalculationOutput {
  principalAmount: number;
  interestRate: number;
  interestAmount: number;
  totalRepaymentAmount: number;
  paymentFrequency?: PaymentFrequency;
  paymentAmount: number;
  numberOfPayments: number;
  startDate?: string;
  dueDate?: string;
  remainingBalanceAtStart: number;
  paymentSchedule: ScheduledPayment[];
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

const MS_PER_DAY = 86400000;

export const roundCurrency = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

const isPositive = (value?: number) => typeof value === 'number' && Number.isFinite(value) && value > 0;

const parseDateOnly = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

const toDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addPeriods = (startDate: string, frequency: PaymentFrequency, periods: number) => {
  const date = parseDateOnly(startDate);
  if (!date) return undefined;
  if (frequency === 'once') return toDateOnly(date);
  const next = new Date(date);
  if (frequency === 'weekly') next.setDate(next.getDate() + periods * 7);
  if (frequency === 'biweekly') next.setDate(next.getDate() + periods * 14);
  if (frequency === 'monthly') next.setMonth(next.getMonth() + periods);
  return toDateOnly(next);
};

const periodsBetweenDates = (startDate: string, dueDate: string, frequency: PaymentFrequency) => {
  const start = parseDateOnly(startDate);
  const due = parseDateOnly(dueDate);
  if (!start || !due || due.getTime() < start.getTime()) return 0;
  if (frequency === 'once') return 1;
  const dayCount = Math.ceil((due.getTime() - start.getTime()) / MS_PER_DAY);
  if (frequency === 'weekly') return Math.max(1, Math.ceil(dayCount / 7));
  if (frequency === 'biweekly') return Math.max(1, Math.ceil(dayCount / 14));
  const monthCount = (due.getFullYear() - start.getFullYear()) * 12 + due.getMonth() - start.getMonth();
  const needsExtraMonth = due.getDate() > start.getDate();
  return Math.max(1, monthCount + (needsExtraMonth ? 1 : 0));
};

export const calculateInterestAmount = ({
  principalAmount = 0,
  interestRate,
  fixedInterestAmount,
  totalRepaymentAmount,
}: Pick<AgreementCalculationInput, 'principalAmount' | 'interestRate' | 'fixedInterestAmount' | 'totalRepaymentAmount'>) => {
  const fixed = fixedInterestAmount ?? 0;
  const total = totalRepaymentAmount ?? 0;
  const rate = interestRate ?? 0;
  if (fixed > 0) return roundCurrency(fixed);
  if (total > 0 && total >= principalAmount) return roundCurrency(total - principalAmount);
  if (rate > 0) return roundCurrency(principalAmount * (rate / 100));
  return 0;
};

export const calculateTotalRepayment = ({
  principalAmount = 0,
  interestRate,
  fixedInterestAmount,
  totalRepaymentAmount,
}: AgreementCalculationInput) => {
  const total = totalRepaymentAmount ?? 0;
  if (total > 0) return roundCurrency(total);
  return roundCurrency(principalAmount + calculateInterestAmount({ principalAmount, interestRate, fixedInterestAmount }));
};

export const calculateNumberOfPayments = ({
  totalRepaymentAmount,
  paymentAmount,
  startDate,
  dueDate,
  paymentFrequency,
}: AgreementCalculationInput) => {
  if (startDate && dueDate && paymentFrequency) return periodsBetweenDates(startDate, dueDate, paymentFrequency);
  const total = totalRepaymentAmount ?? 0;
  const payment = paymentAmount ?? 0;
  if (total <= 0 || payment <= 0) return 0;
  return Math.max(1, Math.ceil(total / payment));
};

export const calculatePaymentAmount = ({
  totalRepaymentAmount,
  numberOfPayments,
}: Pick<AgreementCalculationInput, 'totalRepaymentAmount' | 'numberOfPayments'>) => {
  const total = totalRepaymentAmount ?? 0;
  const count = numberOfPayments ?? 0;
  if (total <= 0 || count <= 0) return 0;
  return roundCurrency(total / count);
};

export const calculateDueDate = ({
  startDate,
  paymentFrequency,
  numberOfPayments,
}: Pick<AgreementCalculationInput, 'startDate' | 'paymentFrequency' | 'numberOfPayments'>) => {
  const count = numberOfPayments ?? 0;
  if (!startDate || !paymentFrequency || count <= 0) return undefined;
  return addPeriods(startDate, paymentFrequency, Math.max(1, Math.ceil(count)));
};

export const generatePaymentSchedule = ({
  totalRepaymentAmount,
  paymentAmount,
  numberOfPayments,
  paymentFrequency,
  startDate,
  dueDate,
}: AgreementCalculationInput) => {
  const total = totalRepaymentAmount ?? 0;
  const payment = paymentAmount ?? 0;
  const requestedCount = numberOfPayments ?? 0;
  if (total <= 0 || requestedCount <= 0 || !paymentFrequency || !startDate) return [];
  const count = Math.max(1, Math.ceil(requestedCount));
  const regularAmount = payment > 0 ? roundCurrency(payment) : calculatePaymentAmount({ totalRepaymentAmount: total, numberOfPayments: count });
  const schedule: ScheduledPayment[] = [];

  for (let index = 1; index <= count; index += 1) {
    const paidBeforeThisPayment = roundCurrency(regularAmount * (index - 1));
    const remaining = roundCurrency(total - paidBeforeThisPayment);
    const amount = index === count ? roundCurrency(Math.max(remaining, 0)) : roundCurrency(Math.min(regularAmount, remaining));
    schedule.push({
      payment_number: index,
      due_date: paymentFrequency === 'once' ? dueDate || startDate : addPeriods(startDate, paymentFrequency, index) || startDate,
      amount,
      status: 'scheduled',
    });
  }

  return schedule;
};

export const validateAgreementCalculation = (input: AgreementCalculationInput) => {
  const errors: string[] = [];
  const principal = input.principalAmount || 0;
  const total = calculateTotalRepayment(input);

  if (!isPositive(principal)) errors.push('Principal is required.');
  if (!input.paymentFrequency) errors.push('Payment frequency is required.');
  if (!parseDateOnly(input.startDate)) errors.push('Start date is required.');
  if (input.dueDate && !parseDateOnly(input.dueDate)) errors.push('Due date must use YYYY-MM-DD.');
  if (input.dueDate && input.startDate && periodsBetweenDates(input.startDate, input.dueDate, input.paymentFrequency || 'once') <= 0) {
    errors.push('Due date must be on or after the start date.');
  }
  if (!isPositive(input.paymentAmount) && !isPositive(input.numberOfPayments) && !isPositive(input.totalRepaymentAmount) && !input.dueDate) {
    errors.push('Add a payment amount, number of payments, total repayment, or due date.');
  }
  const providedTotal = input.totalRepaymentAmount ?? 0;
  if (providedTotal > 0 && providedTotal < principal) {
    errors.push('Total repayment cannot be lower than principal.');
  }
  if (input.paymentAmount !== undefined && input.paymentAmount <= 0) {
    errors.push('Payment amount must be greater than zero.');
  }
  if (isPositive(input.paymentAmount) && isPositive(total)) {
    const calculatedPayments = calculateNumberOfPayments({ totalRepaymentAmount: total, paymentAmount: input.paymentAmount });
    if (!Number.isFinite(calculatedPayments) || calculatedPayments <= 0) errors.push('Payment amount is too low to repay the total.');
  }

  return errors;
};

export const calculateAgreement = (input: AgreementCalculationInput): AgreementCalculationOutput => {
  const principalAmount = roundCurrency(input.principalAmount || 0);
  const totalRepaymentAmount = calculateTotalRepayment({ ...input, principalAmount });
  const interestAmount = calculateInterestAmount({ ...input, principalAmount, totalRepaymentAmount });
  const interestRate = input.interestRate || (principalAmount > 0 ? roundCurrency((interestAmount / principalAmount) * 100) : 0);

  const numberOfPayments =
    input.dueDate && input.startDate && input.paymentFrequency
      ? calculateNumberOfPayments({ startDate: input.startDate, dueDate: input.dueDate, paymentFrequency: input.paymentFrequency })
      : isPositive(input.numberOfPayments)
        ? Math.ceil(input.numberOfPayments || 0)
        : calculateNumberOfPayments({ totalRepaymentAmount, paymentAmount: input.paymentAmount });

  const paymentAmount = isPositive(input.paymentAmount)
    ? roundCurrency(input.paymentAmount || 0)
    : calculatePaymentAmount({ totalRepaymentAmount, numberOfPayments });

  const dueDate = input.dueDate || calculateDueDate({ startDate: input.startDate, paymentFrequency: input.paymentFrequency, numberOfPayments });
  const paymentSchedule = generatePaymentSchedule({
    totalRepaymentAmount,
    paymentAmount,
    numberOfPayments,
    paymentFrequency: input.paymentFrequency,
    startDate: input.startDate,
    dueDate,
  });
  const warnings: string[] = [];
  const finalPayment = paymentSchedule[paymentSchedule.length - 1];
  if (finalPayment && paymentSchedule.length > 1 && roundCurrency(finalPayment.amount) !== roundCurrency(paymentAmount)) {
    warnings.push(`Final payment is ${roundCurrency(finalPayment.amount).toFixed(2)} because of rounding.`);
  }
  const errors = validateAgreementCalculation({ ...input, principalAmount, totalRepaymentAmount, numberOfPayments, paymentAmount, dueDate });

  return {
    principalAmount,
    interestRate,
    interestAmount,
    totalRepaymentAmount,
    paymentFrequency: input.paymentFrequency,
    paymentAmount,
    numberOfPayments,
    startDate: input.startDate,
    dueDate,
    remainingBalanceAtStart: totalRepaymentAmount,
    paymentSchedule,
    errors,
    warnings,
    isValid: errors.length === 0,
  };
};
