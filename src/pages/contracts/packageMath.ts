// Salary package totals for the contract form and detail page (display only; the PDF is calculated on the server).
// Social insurance is calculated by payroll, so it is not part of these totals.
import type { SalaryItem } from '../../types';

const round3 = (v: number) => Math.round(v * 1000) / 1000;

export interface PackageInput {
  basic: number;
  housing: number;
  transport: number;
  items: SalaryItem[];
}

export function packageTotals({ basic, housing, transport, items }: PackageInput) {
  const sumOf = (kind: SalaryItem['kind'], paid: SalaryItem['paid']) =>
    items.filter((i) => i.kind === kind && i.paid === paid).reduce((total, i) => total + (Number(i.amount) || 0), 0);

  const gross = round3(basic + housing + transport + sumOf('allowance', 'monthly'));
  const deductions = round3(sumOf('deduction', 'monthly'));
  const yearlyBonus = round3(sumOf('bonus', 'yearly') + sumOf('allowance', 'yearly'));
  const yearlyDeductions = round3(sumOf('deduction', 'yearly'));
  return {
    gross,
    deductions,
    net: round3(gross - deductions),        // before social insurance
    yearlyBonus,
    totalAnnual: round3(gross * 12 + yearlyBonus - yearlyDeductions), // twelve months of gross plus yearly bonuses
  };
}
