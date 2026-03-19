import { useState, useEffect } from 'react';
import { Plus, IndianRupee, Check, X, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import { fetchBatches, fetchStudents, fetchFeeStatus, createFee, deleteFee } from '../api';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Fees() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [feeStatus, setFeeStatus] = useState([]);
  const [batches, setBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payment modal
  const [payModal, setPayModal] = useState({ open: false, student: null });
  const [payForm, setPayForm] = useState({ student_id: '', amount_paid: '', date_paid: '', fee_month: '', fee_year: '', note: '' });

  useEffect(() => {
    loadData();
  }, [month, year]);

  useEffect(() => {
    loadBatchesAndStudents();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchFeeStatus(month, year);
      setFeeStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchesAndStudents = async () => {
    try {
      const [b, s] = await Promise.all([fetchBatches(), fetchStudents()]);
      setBatches(b);
      setAllStudents(s);
    } catch (err) {
      console.error(err);
    }
  };

  const openPayModal = (student = null) => {
    const today = new Date().toISOString().split('T')[0];
    if (student) {
      setPayForm({
        student_id: student.student_id,
        amount_paid: student.monthly_fee || '',
        date_paid: today,
        fee_month: month,
        fee_year: year,
        note: '',
      });
    } else {
      setPayForm({
        student_id: '',
        amount_paid: '',
        date_paid: today,
        fee_month: month,
        fee_year: year,
        note: '',
      });
    }
    setPayModal({ open: true, student });
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    try {
      await createFee({
        ...payForm,
        amount_paid: parseFloat(payForm.amount_paid),
        fee_month: parseInt(payForm.fee_month),
        fee_year: parseInt(payForm.fee_year),
      });
      setPayModal({ open: false, student: null });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePayment = async (feeId) => {
    if (!confirm('Delete this payment record?')) return;
    try {
      await deleteFee(feeId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStudentSelect = (studentId) => {
    const student = allStudents.find(s => s.id === studentId);
    setPayForm(prev => ({
      ...prev,
      student_id: studentId,
      amount_paid: student?.monthly_fee || prev.amount_paid,
    }));
  };

  // Summary stats
  const totalExpected = feeStatus.reduce((s, f) => s + f.monthly_fee, 0);
  const totalPaid = feeStatus.reduce((s, f) => s + f.total_paid, 0);
  const paidCount = feeStatus.filter(f => f.status === 'paid').length;
  const pendingCount = feeStatus.filter(f => f.status === 'pending' || f.status === 'partial').length;

  // Group by batch
  const grouped = {};
  feeStatus.forEach(f => {
    const key = f.batch_name || 'No Batch';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Log Fees</h1>
          <p className="text-text-secondary text-sm mt-1">Track and record payments</p>
        </div>
        <button className="btn btn-primary" onClick={() => openPayModal()}>
          <Plus size={18} /> Record Payment
        </button>
      </div>

      {/* Month/Year Selector */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <select className="form-select w-auto" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
          {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="form-select w-auto" value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-secondary">
            <span className="text-success font-semibold">{paidCount}</span> paid
          </span>
          <span className="text-text-secondary">
            <span className="text-danger font-semibold">{pendingCount}</span> pending
          </span>
          <span className="text-text-secondary">
            ₹<span className="text-accent font-semibold">{totalPaid.toLocaleString()}</span>/{totalExpected.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Fee Status Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : feeStatus.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <AlertCircle size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No students found. Add students in the Batches page first.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([batchName, students]) => (
          <div key={batchName} className="glass-card overflow-hidden animate-fade-in">
            <div className="px-4 py-3 bg-bg-tertiary/50 border-b border-border">
              <h3 className="font-semibold text-sm">{batchName}</h3>
            </div>
            <div className="divide-y divide-border">
              {students.map(student => (
                <div key={student.student_id} className="px-4 py-3 flex items-center justify-between hover:bg-bg-tertiary/20 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      student.status === 'paid' ? 'bg-success-light text-success' :
                      student.status === 'partial' ? 'bg-warning-light text-warning' :
                      'bg-danger-light text-danger'
                    }`}>
                      {student.status === 'paid' ? <Check size={14} /> :
                       student.status === 'partial' ? '!' : <X size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{student.student_name}</p>
                      <p className="text-xs text-text-muted">
                        ₹{student.monthly_fee}/month
                        {student.status === 'partial' && ` · Paid ₹${student.total_paid}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge ${
                      student.status === 'paid' ? 'badge-paid' :
                      student.status === 'partial' ? 'badge-partial' :
                      'badge-pending'
                    }`}>
                      {student.status}
                    </span>
                    {student.status !== 'paid' && (
                      <button className="btn btn-primary btn-sm" onClick={() => openPayModal(student)}>
                        <IndianRupee size={13} />
                      </button>
                    )}
                    {student.payments?.map(p => (
                      <button key={p.id} className="btn-icon" title={`Delete ₹${p.amount_paid} payment`} onClick={() => handleDeletePayment(p.id)}>
                        <X size={13} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ── Payment Modal ────────────────────────── */}
      <Modal
        isOpen={payModal.open}
        onClose={() => setPayModal({ open: false, student: null })}
        title="Record Payment"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div>
            <label className="form-label">Student</label>
            {payModal.student ? (
              <input className="form-input" value={payModal.student.student_name} disabled />
            ) : (
              <select className="form-select" value={payForm.student_id} onChange={e => handleStudentSelect(e.target.value)} required>
                <option value="">Select student...</option>
                {batches.map(b => (
                  <optgroup key={b.id} label={b.name}>
                    {allStudents.filter(s => s.batch_id === b.id).map(s => (
                      <option key={s.id} value={s.id}>{s.name} — ₹{s.monthly_fee}/mo</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" type="number" min="1" placeholder="2000" value={payForm.amount_paid} onChange={e => setPayForm(p => ({ ...p, amount_paid: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Date Paid</label>
              <input className="form-input" type="date" value={payForm.date_paid} onChange={e => setPayForm(p => ({ ...p, date_paid: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">For Month</label>
              <select className="form-select" value={payForm.fee_month} onChange={e => setPayForm(p => ({ ...p, fee_month: e.target.value }))}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">For Year</label>
              <select className="form-select" value={payForm.fee_year} onChange={e => setPayForm(p => ({ ...p, fee_year: e.target.value }))}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Note (optional)</label>
            <input className="form-input" placeholder="e.g. Paid via UPI" value={payForm.note} onChange={e => setPayForm(p => ({ ...p, note: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => setPayModal({ open: false, student: null })}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1">Record Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
