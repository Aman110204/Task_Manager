import { decryptJSON, encryptJSON } from "../../utils/encryption";
import { loadRecord, saveRecord } from "../../utils/storage";

function loansKey(userId) {
  return `loans:${userId}`;
}

export async function loadLoans(userId) {
  const encrypted = await loadRecord(loansKey(userId), null);
  return decryptJSON(userId, encrypted, []);
}

async function saveLoans(userId, loans) {
  const encrypted = await encryptJSON(userId, loans);
  await saveRecord(loansKey(userId), encrypted);
  return loans;
}

export async function addLoan(userId, input) {
  const loan = {
    id: crypto.randomUUID(),
    name: input.name,
    totalAmount: Number(input.totalAmount || 0),
    emi: Number(input.emi || 0),
    interestRate: Number(input.interestRate || 0),
    nextDueDate: input.nextDueDate,
    paidAmount: 0,
    payments: []
  };
  const current = await loadLoans(userId);
  return saveLoans(userId, [loan, ...current]);
}

export async function recordLoanPayment(userId, loanId, amount) {
  const current = await loadLoans(userId);
  const next = current.map((loan) => {
    if (loan.id !== loanId) return loan;
    const paidAmount = Number(loan.paidAmount || 0) + Number(amount || 0);
    const remainingBalance = Math.max(Number(loan.totalAmount || 0) - paidAmount, 0);
    return {
      ...loan,
      paidAmount,
      remainingBalance,
      payments: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().slice(0, 10),
          amount: Number(amount || 0)
        },
        ...(loan.payments || [])
      ]
    };
  });
  return saveLoans(userId, next);
}

export async function deleteLoan(userId, loanId) {
  const current = await loadLoans(userId);
  return saveLoans(
    userId,
    current.filter((loan) => loan.id !== loanId)
  );
}

// Loan progress logic: paid/total percentage, plus remaining balance approximation.
export function withLoanProgress(loans) {
  return loans.map((loan) => {
    const paid = Number(loan.paidAmount || 0);
    const total = Number(loan.totalAmount || 0);
    const remainingBalance = Math.max(total - paid, 0);
    const progressPercent = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
    return {
      ...loan,
      remainingBalance,
      progressPercent
    };
  });
}
