import React, { useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AgreementStepper } from '@/components/create/AgreementStepper';
import { StepHeader } from '@/components/create/StepHeader';
import { LiveAgreementCard, LiveAgreementData } from '@/components/create/LiveAgreementCard';
import { BorrowerCard } from '@/components/create/BorrowerCard';
import { RecentContactsCarousel } from '@/components/create/RecentContactsCarousel';
import { CalculationSummary } from '@/components/create/CalculationSummary';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { PaymentFrequency, ScheduledPayment } from '@/types/models';
import { calculateAgreement, InterestType } from '@/utils/agreementCalculator';
import { frequencyLabel } from '@/utils/dashboard';
import { userSafeMessage } from '@/utils/errors';
import { formatDate, formatMoneyPrecise, toNumber } from '@/utils/money';
import { isValidEmail, normalizeEmail } from '@/utils/validation';

type CalculationMode = 'payment_amount' | 'number_of_payments' | 'total_repayment' | 'due_date';

const frequencies: PaymentFrequency[] = ['once', 'weekly', 'biweekly', 'monthly'];
const today = new Date().toISOString().slice(0, 10);

const steps = ['Borrower', 'Terms', 'Repayment', 'Review'];
const stepMeta: { icon: keyof typeof Ionicons.glyphMap; title: string; guidance: string }[] = [
  { icon: 'person-outline', title: 'Who is this for?', guidance: 'Choose who this agreement will be sent to.' },
  { icon: 'cash-outline', title: 'Financial terms', guidance: 'Now define the amount and any interest.' },
  { icon: 'calendar-outline', title: 'Repayment plan', guidance: "Let's calculate the repayment plan together." },
  { icon: 'shield-checkmark-outline', title: 'Review & send', guidance: 'Review everything before sending.' },
];

const modeOptions: { value: CalculationMode; label: string; helper: string }[] = [
  { value: 'payment_amount', label: 'Payment amount', helper: 'TRUVO calculates the payment count and due date.' },
  { value: 'number_of_payments', label: 'Number of payments', helper: 'TRUVO calculates the recurring payment amount.' },
  { value: 'total_repayment', label: 'Final total', helper: 'TRUVO calculates interest and payment count.' },
  { value: 'due_date', label: 'Due date', helper: 'TRUVO calculates the payment count from the date.' },
];

const parseOptionalAmount = (value: string) => (value.trim() ? toNumber(value) : undefined);
const titleCase = (value: string) => value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const isIsoDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};
const normalizePhone = (value: string) => value.replace(/\D/g, '');

export default function CreateAgreementScreen() {
  const { agreements, contacts, currentUser, createAgreement, sendAgreementInvite } = useTruvoStore();
  const currency = currentUser.currency || 'USD';
  const money = (value: number) => formatMoneyPrecise(value, currency);

  const [stepIndex, setStepIndex] = useState(0);
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerLocked, setBorrowerLocked] = useState(false);
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

  // Stable draft agreement id for the Live Agreement (kept for the lifetime of this screen).
  const draftId = useRef(`TRV-${today.replace(/-/g, '').slice(2)}-${Math.floor(1000 + (agreements.length + 1) * 37) % 9000 + 1000}`).current;

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
    [calculationMode, dueDate, fixedInterestAmount, interestRate, interestType, numberOfPayments, paymentAmount, paymentFrequency, principalAmount, startDate, totalRepaymentAmount],
  );

  const previewSchedule = useMemo(() => {
    if (showFullSchedule || calculation.paymentSchedule.length <= 4) return calculation.paymentSchedule;
    return [...calculation.paymentSchedule.slice(0, 3), calculation.paymentSchedule[calculation.paymentSchedule.length - 1]];
  }, [calculation.paymentSchedule, showFullSchedule]);

  const normalizedBorrowerEmail = normalizeEmail(borrowerEmail);
  const normalizedBorrowerPhone = normalizePhone(borrowerPhone);
  const borrowerEmailIsValid = isValidEmail(normalizedBorrowerEmail);
  const borrowerPhoneIsValid = !borrowerPhone.trim() || normalizedBorrowerPhone.length >= 7;
  const borrowerIsSelf = normalizedBorrowerEmail === currentUser.email?.toLowerCase();
  const borrowerIsValid = borrowerEmailIsValid && borrowerPhoneIsValid && !borrowerIsSelf;
  const amountIsValid = calculation.principalAmount > 0 && isIsoDate(startDate);
  const repaymentIsValid = calculation.isValid;
  const canContinue = stepIndex === 0 ? borrowerIsValid : stepIndex === 1 ? amountIsValid : stepIndex === 2 ? repaymentIsValid : calculation.isValid && borrowerIsValid;

  // ---- Live Agreement data (evolves in real time) ----
  const estimatedFinish = calculation.paymentSchedule.length
    ? calculation.paymentSchedule[calculation.paymentSchedule.length - 1].due_date
    : calculation.dueDate;

  const interestSummary = (() => {
    if (interestType === 'none') return 'No interest';
    if (interestType === 'rate') return interestRate.trim() ? `${interestRate.trim()}%` : null;
    return calculation.interestAmount > 0 ? money(calculation.interestAmount) : null;
  })();

  const repaymentSummary =
    calculation.numberOfPayments > 0
      ? `${calculation.numberOfPayments} ${frequencyLabel(paymentFrequency)} payment${calculation.numberOfPayments === 1 ? '' : 's'}`
      : null;

  const liveData: LiveAgreementData = {
    agreementId: draftId,
    createdDate: formatDate(today),
    status: canContinue && stepIndex === steps.length - 1 && borrowerIsValid && calculation.isValid ? 'ready' : 'draft',
    lender: currentUser.name || 'You',
    borrower: borrowerLocked ? borrowerName.trim() || normalizedBorrowerEmail : null,
    principal: calculation.principalAmount > 0 ? money(calculation.principalAmount) : null,
    interest: interestSummary,
    repayment: repaymentSummary,
    totalRepayment: calculation.totalRepaymentAmount > 0 ? money(calculation.totalRepaymentAmount) : null,
    estimatedFinish: estimatedFinish ? formatDate(estimatedFinish) : null,
    borrowerSelected: borrowerLocked,
  };

  const calcRows = [
    { label: 'Interest', value: money(calculation.interestAmount), ready: calculation.isValid },
    { label: 'Payment amount', value: money(calculation.paymentAmount), ready: calculation.isValid && calculation.paymentAmount > 0 },
    { label: 'Number of payments', value: String(calculation.numberOfPayments), ready: calculation.numberOfPayments > 0 },
    { label: 'Total repayment', value: money(calculation.totalRepaymentAmount), ready: calculation.totalRepaymentAmount > 0 },
    { label: 'Estimated finish', value: estimatedFinish ? formatDate(estimatedFinish) : '', ready: Boolean(estimatedFinish) },
  ];

  const selectContact = (email: string, name?: string) => {
    setBorrowerEmail(email);
    setBorrowerName(name || '');
    setBorrowerLocked(true);
  };

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

  const cancel = () => {
    Alert.alert('Discard agreement?', 'Your draft will not be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const saveDraft = () => {
    Alert.alert('Draft kept', 'Your progress stays on this screen. Finish the steps to send the agreement.');
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
        } else {
          Alert.alert('Agreement sent', invite.message || 'The borrower invitation email was sent.');
        }
      } catch {
        Alert.alert('Agreement created, email not sent', userSafeMessage('Open the agreement details to resend the invite.'));
      }
      router.push(`/agreement/${agreement.id}`);
    } catch {
      Alert.alert('Could not create agreement', userSafeMessage('Please check the details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const isFinalStep = stepIndex === steps.length - 1;
  const meta = stepMeta[stepIndex];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AgreementStepper steps={steps} current={stepIndex} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <LiveAgreementCard data={liveData} />

          <StepHeader icon={meta.icon} title={meta.title} guidance={meta.guidance} />

          {freeLimitReached ? (
            <View style={styles.limit}>
              <Text style={styles.limitText}>Free plans support up to 3 active agreements. Upgrade for unlimited active agreements.</Text>
            </View>
          ) : null}

          {stepIndex === 0 ? (
            <View style={styles.stepBody}>
              {borrowerLocked && borrowerEmailIsValid ? (
                <BorrowerCard name={borrowerName} email={normalizedBorrowerEmail} onChange={() => setBorrowerLocked(false)} />
              ) : (
                <>
                  <RecentContactsCarousel
                    contacts={contacts.slice(0, 8)}
                    selectedEmail={normalizedBorrowerEmail}
                    onSelect={(contact) => selectContact(contact.contactEmail, contact.contactName)}
                  />
                  <FormInput label="Borrower email" value={borrowerEmail} onChangeText={setBorrowerEmail} keyboardType="email-address" autoCapitalize="none" placeholder="borrower@example.com" />
                  {attemptedStep && !borrowerEmailIsValid ? <Text style={styles.errorText}>Enter a valid borrower email.</Text> : null}
                  {attemptedStep && borrowerIsSelf ? <Text style={styles.errorText}>You cannot create an agreement with yourself.</Text> : null}
                  <FormInput label="Borrower name (optional)" value={borrowerName} onChangeText={setBorrowerName} placeholder="Name" />
                  <FormInput label="Secondary phone (optional)" value={borrowerPhone} onChangeText={setBorrowerPhone} keyboardType="phone-pad" placeholder="+1 555 0123" />
                  {attemptedStep && !borrowerPhoneIsValid ? <Text style={styles.errorText}>Use a valid phone number or leave it blank.</Text> : null}
                  {borrowerEmailIsValid && !borrowerIsSelf ? (
                    <PrimaryButton label="Use this contact" variant="outline" onPress={() => setBorrowerLocked(true)} />
                  ) : null}
                </>
              )}
            </View>
          ) : null}

          {stepIndex === 1 ? (
            <View style={styles.stepBody}>
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
            </View>
          ) : null}

          {stepIndex === 2 ? (
            <View style={styles.stepBody}>
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: calculationMode === mode.value }}
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
              <CalculationSummary rows={calcRows} />
              {attemptedStep ? <ValidationList errors={calculation.errors} warnings={calculation.warnings} /> : null}
            </View>
          ) : null}

          {stepIndex === 3 ? (
            <View style={styles.stepBody}>
              <WizardCard title="Payment schedule" subtitle="Preview the payments that will be tracked after acceptance.">
                {previewSchedule.length ? (
                  <View style={styles.scheduleCard}>
                    {previewSchedule.map((payment, index) => (
                      <ScheduleRow
                        key={`${payment.payment_number}-${payment.due_date}`}
                        payment={payment}
                        currency={currency}
                        isFinal={payment.payment_number === calculation.paymentSchedule.length}
                        showGap={index === 3 && !showFullSchedule && calculation.paymentSchedule.length > 4}
                      />
                    ))}
                    {calculation.paymentSchedule.length > 4 ? (
                      <PrimaryButton label={showFullSchedule ? 'Hide full schedule' : 'View full schedule'} variant="outline" onPress={() => setShowFullSchedule((value) => !value)} style={styles.scheduleButton} />
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.emptySchedule}>Complete repayment details to preview scheduled payments.</Text>
                )}
              </WizardCard>

              <WizardCard title="Notes & disclaimer" subtitle="Add optional context before sending.">
                <FormInput label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Optional context" style={styles.notes} />
                <View style={styles.disclaimer}>
                  <Text style={styles.disclaimerText}>TRUVO does not provide loans or financial services. TRUVO only records and tracks agreements between individuals.</Text>
                </View>
              </WizardCard>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            {stepIndex > 0 ? (
              <PrimaryButton label="Back" variant="outline" onPress={goBack} style={styles.footerSideButton} />
            ) : (
              <PrimaryButton label="Cancel" variant="outline" onPress={cancel} style={styles.footerSideButton} />
            )}
            <PrimaryButton
              label={isFinalStep ? 'Send Agreement' : freeLimitReached ? 'Upgrade to continue' : 'Next'}
              onPress={isFinalStep ? submit : goNext}
              loading={loading}
              disabled={!canContinue && !freeLimitReached}
              style={styles.footerMainButton}
            />
          </View>
          <Pressable accessibilityRole="button" onPress={saveDraft} hitSlop={8} style={styles.saveDraft}>
            <Ionicons name="bookmark-outline" size={14} color={colors.textMuted} />
            <Text style={styles.saveDraftText}>Save Draft</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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

function Chip({ label, active, onPress, compact }: { label: string; active: boolean; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, compact && styles.compactChip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ScheduleRow({ payment, currency, isFinal, showGap }: { payment: ScheduledPayment; currency: string; isFinal: boolean; showGap: boolean }) {
  return (
    <>
      {showGap ? <Text style={styles.scheduleGap}>...</Text> : null}
      <View style={styles.scheduleRow}>
        <View>
          <Text style={styles.scheduleNumber}>Payment {payment.payment_number}</Text>
          <Text style={styles.scheduleDate}>{formatDate(payment.due_date)}</Text>
        </View>
        <View style={styles.scheduleAmountWrap}>
          <Text style={styles.scheduleAmount}>{formatMoneyPrecise(payment.amount, currency)}</Text>
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
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.lg },
  stepBody: { gap: spacing.md },
  limit: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: '#FEF3C7' },
  limitText: { color: colors.primary, fontSize: typography.small, fontWeight: '700', lineHeight: 21 },
  wizardCard: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  cardHeading: { gap: spacing.xs },
  cardTitle: { color: colors.text, fontSize: typography.h3, fontWeight: '900' },
  cardSubtitle: { color: colors.textMuted, fontSize: typography.small, lineHeight: 22 },
  fieldLabel: { color: colors.text, fontSize: typography.small, fontWeight: '900' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  compactChip: { minHeight: 40, paddingHorizontal: spacing.md },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: typography.small, fontWeight: '900' },
  chipTextActive: { color: '#FFFFFF' },
  inlineGrid: { gap: spacing.md },
  modeGrid: { gap: spacing.sm },
  modeCard: { padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: spacing.xs },
  modeCardActive: { borderColor: colors.secondary, backgroundColor: '#ECFDF5' },
  modeTitle: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  modeTitleActive: { color: colors.primary },
  modeHelper: { color: colors.textMuted, fontSize: typography.small, lineHeight: 20 },
  modeHelperActive: { color: '#047857' },
  validationBox: { gap: spacing.xs },
  errorText: { color: colors.danger, fontSize: typography.small, fontWeight: '700', lineHeight: 20 },
  warningText: { color: colors.warning, fontSize: typography.small, fontWeight: '700', lineHeight: 20 },
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
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  footerButtons: { flexDirection: 'row', gap: spacing.sm },
  footerSideButton: { flex: 1 },
  footerMainButton: { flex: 2 },
  saveDraft: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  saveDraftText: { color: colors.textMuted, fontSize: typography.small, fontWeight: '800' },
});
