import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { PaymentFrequency, ScheduledPayment } from '@/types/models';
import { calculateAgreement, InterestType } from '@/utils/agreementCalculator';
import { formatDate, formatMoney, toNumber } from '@/utils/money';

type CalculationMode = 'payment_amount' | 'number_of_payments' | 'total_repayment' | 'due_date';

const frequencies: PaymentFrequency[] = ['once', 'weekly', 'biweekly', 'monthly'];
const today = new Date().toISOString().slice(0, 10);

const steps = ['Borrower', 'Amount', 'Repayment plan', 'Review and send'];

const modeOptions: { value: CalculationMode; label: string; helper: string }[] = [
  { value: 'payment_amount', label: 'Payment amount', helper: 'TRUVO calculates the payment count and due date.' },
  { value: 'number_of_payments', label: 'Number of payments', helper: 'TRUVO calculates the recurring payment amount.' },
  { value: 'total_repayment', label: 'Final total', helper: 'TRUVO calculates interest and payment count.' },
  { value: 'due_date', label: 'Due date', helper: 'TRUVO calculates the payment count from the date.' },
];

const parseOptionalAmount = (value: string) => (value.trim() ? toNumber(value) : undefined);
const titleCase = (value: string) => value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const normalizePhone = (value: string) => value.replace(/\D/g, '');

export default function CreateAgreementScreen() {
  const { agreements, contacts, currentUser, createAgreement, sendAgreementInvite } = useTruvoStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestType, setInterestType] = useState<InterestType>('none');
  const [interestRate, setInterestRate] = useState('');
  const [fixedInterestAmount, setFixedInterestAmount] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('weekly');
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('payment_amount');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [numberOfPayments, setNumberOfPayments] = useState('');
  const [totalRepaymentAmount, setTotalRepaymentAmount] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [attemptedStep, setAttemptedStep] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeCount = agreements.filter((agreement) => agreement.lenderId === currentUser.id && agreement.status === 'active').length;
  const freeLimitReached = currentUser.subscription_status === 'free' && activeCount >= 3;

  const calculation = useMemo(
    () =>
      calculateAgreement({
        principalAmount: parseOptionalAmount(principalAmount),
        paymentFrequency,
        startDate,
        dueDate: calculationMode === 'due_date' ? dueDate : undefined,
        paymentAmount: calculationMode === 'payment_amount' || calculationMode === 'total_repayment' ? parseOptionalAmount(paymentAmount) : undefined,
        numberOfPayments: calculationMode === 'number_of_payments' ? parseOptionalAmount(numberOfPayments) : undefined,
        interestRate: interestType === 'rate' ? parseOptionalAmount(interestRate) : undefined,
        fixedInterestAmount: interestType === 'fixed' ? parseOptionalAmount(fixedInterestAmount) : undefined,
        totalRepaymentAmount: calculationMode === 'total_repayment' ? parseOptionalAmount(totalRepaymentAmount) : undefined,
      }),
    [
      calculationMode,
      dueDate,
      fixedInterestAmount,
      interestRate,
      interestType,
      numberOfPayments,
      paymentAmount,
      paymentFrequency,
      principalAmount,
      startDate,
      totalRepaymentAmount,
    ],
  );

  const previewSchedule = useMemo(() => {
    if (showFullSchedule || calculation.paymentSchedule.length <= 4) return calculation.paymentSchedule;
    return [...calculation.paymentSchedule.slice(0, 3), calculation.paymentSchedule[calculation.paymentSchedule.length - 1]];
  }, [calculation.paymentSchedule, showFullSchedule]);

  const contactSuggestions = useMemo(() => {
    const query = borrowerEmail.trim().toLowerCase();
    return contacts
      .filter((contact) => {
        if (!query) return true;
        return contact.contactEmail.toLowerCase().includes(query) || contact.contactName?.toLowerCase().includes(query);
      })
      .slice(0, 4);
  }, [borrowerEmail, contacts]);

  const normalizedBorrowerEmail = borrowerEmail.trim().toLowerCase();
  const normalizedBorrowerPhone = normalizePhone(borrowerPhone);
  const normalizedCurrentUserPhone = normalizePhone(currentUser.phone);
  const borrowerEmailIsValid = isValidEmail(normalizedBorrowerEmail);
  const borrowerPhoneIsValid = !borrowerPhone.trim() || normalizedBorrowerPhone.length >= 7;
  const borrowerIsSelf =
    normalizedBorrowerEmail === currentUser.email?.toLowerCase() ||
    Boolean(normalizedBorrowerPhone && normalizedBorrowerPhone === normalizedCurrentUserPhone);
  const borrowerIsValid = borrowerEmailIsValid && borrowerPhoneIsValid && !borrowerIsSelf;
  const amountIsValid = calculation.principalAmount > 0 && isIsoDate(startDate);
  const repaymentIsValid = calculation.isValid;
  const canContinue = stepIndex === 0 ? borrowerIsValid : stepIndex === 1 ? amountIsValid : stepIndex === 2 ? repaymentIsValid : calculation.isValid && borrowerIsValid;
  const currentStep = steps[stepIndex];

  const goNext = () => {
    setAttemptedStep(true);
    if (!canContinue) return;
    setAttemptedStep(false);
    setStepIndex((value) => Math.min(value + 1, steps.length - 1));
  };

  const goBack = () => {
    setAttemptedStep(false);
    setStepIndex((value) => Math.max(value - 1, 0));
  };

  const submit = async () => {
    setAttemptedStep(true);
    if (freeLimitReached) {
      router.push('/premium');
      return;
    }
    if (!borrowerEmailIsValid) {
      Alert.alert('Add a valid borrower email');
      setStepIndex(0);
      return;
    }
    if (!borrowerPhoneIsValid) {
      Alert.alert('Check optional phone', 'Use a valid phone number or leave it blank.');
      setStepIndex(0);
      return;
    }
    if (borrowerIsSelf) {
      Alert.alert('Choose another borrower', 'You cannot create an agreement with yourself.');
      setStepIndex(0);
      return;
    }
    if (!calculation.isValid) {
      Alert.alert('Check agreement details', calculation.errors[0]);
      setStepIndex(2);
      return;
    }
    try {
      setLoading(true);
      const agreement = await createAgreement({
        borrowerPhone: borrowerPhone.trim(),
        borrowerEmail: normalizedBorrowerEmail,
        borrowerName: borrowerName.trim() || undefined,
        principalAmount: calculation.principalAmount,
        interestRate: calculation.interestRate,
        totalRepaymentAmount: calculation.totalRepaymentAmount,
        numberOfPayments: calculation.numberOfPayments,
        paymentFrequency,
        startDate,
        dueDate: calculation.dueDate || startDate,
        notes: notes.trim() || undefined,
        paymentSchedule: calculation.paymentSchedule,
      });
      try {
        const invite = await sendAgreementInvite(agreement.id);
        if (invite.status === 'skipped') {
          Alert.alert('Agreement created', invite.message);
        }
      } catch (inviteError) {
        Alert.alert(
          'Agreement created, email not sent',
          inviteError instanceof Error ? inviteError.message : 'Open the agreement details to resend the invite.',
        );
      }
      router.push(`/agreement/${agreement.id}`);
    } catch (error) {
      Alert.alert('Could not create agreement', error instanceof Error ? error.message : 'Please check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.progressWrap}>
        <Text style={styles.eyebrow}>Create agreement</Text>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Step {stepIndex + 1} of {steps.length}</Text>
          <Text style={styles.progressName}>{currentStep}</Text>
        </View>
        <View style={styles.progressTrack}>
          {steps.map((step, index) => (
            <View key={step} style={[styles.progressSegment, index <= stepIndex && styles.progressSegmentActive]} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {freeLimitReached ? (
          <View style={styles.limit}>
            <Text style={styles.limitText}>Free plans support up to 3 active agreements. Upgrade for unlimited active agreements.</Text>
          </View>
        ) : null}

        {stepIndex === 0 ? (
          <WizardCard title="Borrower" subtitle="Start with the person who will receive the request.">
            <FormInput label="Borrower email" value={borrowerEmail} onChangeText={setBorrowerEmail} keyboardType="email-address" autoCapitalize="none" placeholder="borrower@example.com" />
            {attemptedStep && !borrowerEmailIsValid ? <Text style={styles.errorText}>Enter a valid borrower email.</Text> : null}
            {attemptedStep && borrowerIsSelf ? <Text style={styles.errorText}>You cannot create an agreement with yourself.</Text> : null}
            {contactSuggestions.length ? (
              <View style={styles.suggestions}>
                <Text style={styles.fieldLabel}>Saved contacts</Text>
                <View style={styles.chipRow}>
                  {contactSuggestions.map((contact) => (
                    <Chip
                      key={contact.id}
                      label={contact.contactName || contact.contactEmail}
                      active={borrowerEmail.trim().toLowerCase() === contact.contactEmail.toLowerCase()}
                      onPress={() => {
                        setBorrowerEmail(contact.contactEmail);
                        setBorrowerName(contact.contactName || '');
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}
            <FormInput label="Borrower name optional" value={borrowerName} onChangeText={setBorrowerName} placeholder="Name" />
            <FormInput label="Secondary phone optional" value={borrowerPhone} onChangeText={setBorrowerPhone} keyboardType="phone-pad" placeholder="+1 555 0123" />
            {attemptedStep && !borrowerPhoneIsValid ? <Text style={styles.errorText}>Use a valid phone number or leave it blank.</Text> : null}
          </WizardCard>
        ) : null}

        {stepIndex === 1 ? (
          <WizardCard title="Amount" subtitle="Set the principal and any interest terms.">
            <FormInput label="Principal amount" value={principalAmount} onChangeText={setPrincipalAmount} keyboardType="decimal-pad" placeholder="7000" />
            {attemptedStep && calculation.principalAmount <= 0 ? <Text style={styles.errorText}>Principal is required.</Text> : null}
            <FormInput label="Start date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
            {attemptedStep && !isIsoDate(startDate) ? <Text style={styles.errorText}>Start date must use YYYY-MM-DD.</Text> : null}
            <Text style={styles.fieldLabel}>Interest</Text>
            <View style={styles.chipRow}>
              <Chip label="No interest" active={interestType === 'none'} onPress={() => setInterestType('none')} />
              <Chip label="Add interest" active={interestType !== 'none'} onPress={() => setInterestType('rate')} />
            </View>
            {interestType !== 'none' ? (
              <View style={styles.inlineGrid}>
                <Text style={styles.fieldLabel}>Interest type</Text>
                <View style={styles.chipRow}>
                  <Chip label="Rate" active={interestType === 'rate'} onPress={() => setInterestType('rate')} compact />
                  <Chip label="Fixed" active={interestType === 'fixed'} onPress={() => setInterestType('fixed')} compact />
                </View>
                {interestType === 'rate' ? (
                  <FormInput label="Interest rate %" value={interestRate} onChangeText={setInterestRate} keyboardType="decimal-pad" placeholder="10" />
                ) : (
                  <FormInput label="Fixed interest amount" value={fixedInterestAmount} onChangeText={setFixedInterestAmount} keyboardType="decimal-pad" placeholder="700" />
                )}
              </View>
            ) : null}
          </WizardCard>
        ) : null}

        {stepIndex === 2 ? (
          <WizardCard title="Repayment plan" subtitle="Choose the one detail you know. TRUVO fills the rest.">
            <Text style={styles.fieldLabel}>Payment frequency</Text>
            <View style={styles.chipRow}>
              {frequencies.map((frequency) => (
                <Chip key={frequency} label={titleCase(frequency)} active={paymentFrequency === frequency} onPress={() => setPaymentFrequency(frequency)} />
              ))}
            </View>
            <Text style={styles.fieldLabel}>I know the...</Text>
            <View style={styles.modeGrid}>
              {modeOptions.map((mode) => (
                <Pressable
                  key={mode.value}
                  onPress={() => setCalculationMode(mode.value)}
                  style={[styles.modeCard, calculationMode === mode.value && styles.modeCardActive]}
                >
                  <Text style={[styles.modeTitle, calculationMode === mode.value && styles.modeTitleActive]}>{mode.label}</Text>
                  <Text style={[styles.modeHelper, calculationMode === mode.value && styles.modeHelperActive]}>{mode.helper}</Text>
                </Pressable>
              ))}
            </View>
            {calculationMode === 'payment_amount' ? (
              <FormInput label="Payment amount" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="decimal-pad" placeholder="100" />
            ) : null}
            {calculationMode === 'number_of_payments' ? (
              <FormInput label="Number of payments" value={numberOfPayments} onChangeText={setNumberOfPayments} keyboardType="number-pad" placeholder="20" />
            ) : null}
            {calculationMode === 'total_repayment' ? (
              <>
                <FormInput label="Total repayment amount" value={totalRepaymentAmount} onChangeText={setTotalRepaymentAmount} keyboardType="decimal-pad" placeholder="8000" />
                <FormInput label="Payment amount" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="decimal-pad" placeholder="100" />
              </>
            ) : null}
            {calculationMode === 'due_date' ? (
              <FormInput label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />
            ) : null}
            {attemptedStep ? <ValidationList errors={calculation.errors} warnings={calculation.warnings} /> : null}
          </WizardCard>
        ) : null}

        {stepIndex === 3 ? (
          <ReviewStep
            borrowerPhone={borrowerPhone}
            borrowerEmail={borrowerEmail}
            borrowerName={borrowerName}
            notes={notes}
            setNotes={setNotes}
            calculation={calculation}
            paymentFrequency={paymentFrequency}
            previewSchedule={previewSchedule}
            showFullSchedule={showFullSchedule}
            setShowFullSchedule={setShowFullSchedule}
          />
        ) : null}
      </ScrollView>

      <LiveSummary
        calculation={calculation}
        stepIndex={stepIndex}
        canContinue={canContinue || freeLimitReached}
        freeLimitReached={freeLimitReached}
        loading={loading}
        onBack={goBack}
        onNext={goNext}
        onSubmit={submit}
      />
    </SafeAreaView>
  );
}

function WizardCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={styles.wizardCard}>
      <View style={styles.cardHeading}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

function ReviewStep({
  borrowerPhone,
  borrowerEmail,
  borrowerName,
  notes,
  setNotes,
  calculation,
  paymentFrequency,
  previewSchedule,
  showFullSchedule,
  setShowFullSchedule,
}: {
  borrowerPhone: string;
  borrowerEmail: string;
  borrowerName: string;
  notes: string;
  setNotes: (value: string) => void;
  calculation: ReturnType<typeof calculateAgreement>;
  paymentFrequency: PaymentFrequency;
  previewSchedule: ScheduledPayment[];
  showFullSchedule: boolean;
  setShowFullSchedule: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <View style={styles.reviewStack}>
      <View style={styles.agreementSummary}>
        <Text style={styles.reviewEyebrow}>Agreement summary</Text>
        <Text style={styles.reviewTitle}>{borrowerName.trim() || borrowerEmail.trim() || 'Borrower'}</Text>
        <Text style={styles.reviewSubtitle}>{borrowerEmail.trim() || borrowerPhone.trim()}</Text>
        <Text style={styles.reviewTotal}>{formatMoney(calculation.totalRepaymentAmount)}</Text>
        <Text style={styles.reviewSubtitle}>
          {calculation.numberOfPayments || 0} {titleCase(paymentFrequency)} payment{calculation.numberOfPayments === 1 ? '' : 's'} of {formatMoney(calculation.paymentAmount)}
        </Text>
        <View style={styles.reviewDivider} />
        <View style={styles.reviewGrid}>
          <ReviewMetric label="Principal" value={formatMoney(calculation.principalAmount)} />
          <ReviewMetric label="Interest" value={formatMoney(calculation.interestAmount)} />
          <ReviewMetric label="Starts" value={calculation.startDate ? formatDate(calculation.startDate) : 'Pending'} />
          <ReviewMetric label="Due" value={calculation.dueDate ? formatDate(calculation.dueDate) : 'Pending'} />
        </View>
      </View>

      <WizardCard title="Payment schedule" subtitle="Preview the payments that will be tracked after acceptance.">
        {previewSchedule.length ? (
          <View style={styles.scheduleCard}>
            {previewSchedule.map((payment, index) => (
              <ScheduleRow
                key={`${payment.payment_number}-${payment.due_date}`}
                payment={payment}
                isFinal={payment.payment_number === calculation.paymentSchedule.length}
                showGap={index === 3 && !showFullSchedule && calculation.paymentSchedule.length > 4}
              />
            ))}
            {calculation.paymentSchedule.length > 4 ? (
              <PrimaryButton
                label={showFullSchedule ? 'Hide full schedule' : 'View full schedule'}
                variant="outline"
                onPress={() => setShowFullSchedule((value) => !value)}
                style={styles.scheduleButton}
              />
            ) : null}
          </View>
        ) : (
          <Text style={styles.emptySchedule}>Complete repayment details to preview scheduled payments.</Text>
        )}
      </WizardCard>

      <WizardCard title="Notes and disclaimer" subtitle="Add optional context before sending.">
        <FormInput label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Optional context" style={styles.notes} />
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            TRUVO does not provide loans or financial services. TRUVO only records and tracks agreements between individuals.
          </Text>
        </View>
      </WizardCard>
    </View>
  );
}

function LiveSummary({
  calculation,
  stepIndex,
  canContinue,
  freeLimitReached,
  loading,
  onBack,
  onNext,
  onSubmit,
}: {
  calculation: ReturnType<typeof calculateAgreement>;
  stepIndex: number;
  canContinue: boolean;
  freeLimitReached: boolean;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const isFinalStep = stepIndex === steps.length - 1;
  return (
    <View style={styles.liveSummary}>
      <View style={styles.liveTopRow}>
        <View>
          <Text style={styles.liveLabel}>Total repayment</Text>
          <Text style={styles.liveTotal}>{formatMoney(calculation.totalRepaymentAmount)}</Text>
        </View>
        <View style={styles.livePill}>
          <Text style={styles.livePillText}>{calculation.numberOfPayments || 0} payments</Text>
        </View>
      </View>
      <View style={styles.liveMetricRow}>
        <FooterMetric label="Payment" value={formatMoney(calculation.paymentAmount)} />
        <FooterMetric label="Interest" value={formatMoney(calculation.interestAmount)} />
        <FooterMetric label="Due" value={calculation.dueDate ? formatDate(calculation.dueDate) : 'Pending'} />
      </View>
      {calculation.warnings[0] ? <Text style={styles.warningText}>{calculation.warnings[0]}</Text> : null}
      <View style={styles.footerButtons}>
        {stepIndex > 0 ? <PrimaryButton label="Back" variant="outline" onPress={onBack} style={styles.footerButton} /> : null}
        <PrimaryButton
          label={isFinalStep ? 'Send agreement request' : freeLimitReached ? 'Upgrade to continue' : 'Next'}
          onPress={isFinalStep ? onSubmit : onNext}
          loading={loading}
          disabled={!canContinue}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

function Chip({ label, active, onPress, compact }: { label: string; active: boolean; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, compact && styles.compactChip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ReviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewMetric}>
      <Text style={styles.reviewMetricLabel}>{label}</Text>
      <Text style={styles.reviewMetricValue}>{value}</Text>
    </View>
  );
}

function FooterMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.footerMetric}>
      <Text style={styles.footerMetricLabel}>{label}</Text>
      <Text style={styles.footerMetricValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ScheduleRow({ payment, isFinal, showGap }: { payment: ScheduledPayment; isFinal: boolean; showGap: boolean }) {
  return (
    <>
      {showGap ? <Text style={styles.scheduleGap}>...</Text> : null}
      <View style={styles.scheduleRow}>
        <View>
          <Text style={styles.scheduleNumber}>Payment {payment.payment_number}</Text>
          <Text style={styles.scheduleDate}>{formatDate(payment.due_date)}</Text>
        </View>
        <View style={styles.scheduleAmountWrap}>
          <Text style={styles.scheduleAmount}>{formatMoney(payment.amount)}</Text>
          {isFinal ? <Text style={styles.finalLabel}>Final</Text> : null}
        </View>
      </View>
    </>
  );
}

function ValidationList({ errors, warnings }: { errors: string[]; warnings: string[] }) {
  if (!errors.length && !warnings.length) return null;
  return (
    <View style={styles.validationBox}>
      {errors.map((error) => (
        <Text key={error} style={styles.errorText}>{error}</Text>
      ))}
      {warnings.map((warning) => (
        <Text key={warning} style={styles.warningText}>{warning}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  progressWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  eyebrow: { color: colors.secondary, fontSize: typography.caption, fontWeight: '900', textTransform: 'uppercase' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.md },
  progressTitle: { color: colors.text, fontSize: typography.h2, fontWeight: '900', flex: 1 },
  progressName: { color: colors.textMuted, fontSize: typography.small, fontWeight: '900', textAlign: 'right', flex: 1 },
  progressTrack: { flexDirection: 'row', gap: spacing.xs },
  progressSegment: { height: 6, flex: 1, borderRadius: radii.pill, backgroundColor: colors.border },
  progressSegmentActive: { backgroundColor: colors.secondary },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 252, gap: spacing.lg },
  limit: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: '#FEF3C7' },
  limitText: { color: colors.primary, fontSize: typography.small, fontWeight: '700', lineHeight: 21 },
  wizardCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardHeading: { gap: spacing.xs },
  cardTitle: { color: colors.text, fontSize: typography.h2, fontWeight: '900' },
  cardSubtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
  fieldLabel: { color: colors.text, fontSize: typography.small, fontWeight: '900' },
  suggestions: { gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  compactChip: { minHeight: 40, paddingHorizontal: spacing.md },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: typography.small, fontWeight: '900' },
  chipTextActive: { color: '#FFFFFF' },
  inlineGrid: { gap: spacing.md },
  modeGrid: { gap: spacing.sm },
  modeCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  modeCardActive: { borderColor: colors.secondary, backgroundColor: '#ECFDF5' },
  modeTitle: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  modeTitleActive: { color: colors.primary },
  modeHelper: { color: colors.textMuted, fontSize: typography.small, lineHeight: 20 },
  modeHelperActive: { color: '#047857' },
  validationBox: { gap: spacing.xs },
  errorText: { color: colors.danger, fontSize: typography.small, fontWeight: '700', lineHeight: 20 },
  warningText: { color: colors.warning, fontSize: typography.small, fontWeight: '700', lineHeight: 20 },
  reviewStack: { gap: spacing.lg },
  agreementSummary: { padding: spacing.xl, borderRadius: radii.lg, backgroundColor: colors.primary, gap: spacing.md },
  reviewEyebrow: { color: '#A7F3D0', fontSize: typography.caption, fontWeight: '900', textTransform: 'uppercase' },
  reviewTitle: { color: '#FFFFFF', fontSize: typography.h2, fontWeight: '900' },
  reviewTotal: { color: '#FFFFFF', fontSize: 42, fontWeight: '900' },
  reviewSubtitle: { color: '#CBD5E1', fontSize: typography.body, lineHeight: 24, fontWeight: '700' },
  reviewDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.16)' },
  reviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  reviewMetric: { width: '47%', gap: spacing.xs },
  reviewMetricLabel: { color: '#CBD5E1', fontSize: typography.caption, fontWeight: '800' },
  reviewMetricValue: { color: '#FFFFFF', fontSize: typography.body, fontWeight: '900' },
  scheduleCard: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  scheduleRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  scheduleNumber: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  scheduleDate: { color: colors.textMuted, fontSize: typography.small, marginTop: spacing.xs },
  scheduleAmountWrap: { alignItems: 'flex-end', gap: spacing.xs },
  scheduleAmount: { color: colors.primary, fontSize: typography.body, fontWeight: '900' },
  finalLabel: { color: colors.secondary, fontSize: typography.caption, fontWeight: '900', textTransform: 'uppercase' },
  scheduleGap: { color: colors.textMuted, fontSize: typography.body, fontWeight: '900', textAlign: 'center' },
  scheduleButton: { marginTop: spacing.sm },
  emptySchedule: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
  notes: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.md },
  disclaimer: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#BAE6FD' },
  disclaimerText: { color: colors.primary, fontSize: typography.small, fontWeight: '700', lineHeight: 21 },
  liveSummary: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  liveTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  liveLabel: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '900', textTransform: 'uppercase' },
  liveTotal: { color: colors.primary, fontSize: typography.h1, fontWeight: '900' },
  livePill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: '#ECFDF5' },
  livePillText: { color: '#047857', fontSize: typography.caption, fontWeight: '900' },
  liveMetricRow: { flexDirection: 'row', gap: spacing.sm },
  footerMetric: { flex: 1, padding: spacing.sm, borderRadius: radii.md, backgroundColor: colors.background, gap: spacing.xs },
  footerMetricLabel: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '800' },
  footerMetricValue: { color: colors.text, fontSize: typography.small, fontWeight: '900' },
  footerButtons: { flexDirection: 'row', gap: spacing.sm },
  footerButton: { flex: 1 },
});
