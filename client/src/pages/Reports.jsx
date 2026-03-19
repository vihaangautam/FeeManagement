import { useState, useEffect } from 'react';
import { Download, Check, X, AlertTriangle } from 'lucide-react';
import { fetchBatches, fetchStudents, fetchFeeStatus, exportFees } from '../api';
import * as XLSX from 'xlsx';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [students, setStudents] = useState([]);
  const [monthData, setMonthData] = useState({});
  const [loading, setLoading] = useState(true);
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    loadAllData();
  }, [year]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const studentList = await fetchStudents();
      setStudents(studentList);

      // Load fee status for all 12 months
      const promises = [];
      for (let m = 1; m <= 12; m++) {
        promises.push(
          fetchFeeStatus(m, year).then(data => ({ month: m, data }))
        );
      }
      const results = await Promise.all(promises);
      const mData = {};
      results.forEach(r => { mData[r.month] = r.data; });
      setMonthData(mData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (studentId, month) => {
    const data = monthData[month];
    if (!data) return null;
    return data.find(d => d.student_id === studentId);
  };

  const handleExport = async () => {
    try {
      const result = await exportFees(exportMonth, year);
      const ws = XLSX.utils.json_to_sheet(result.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${FULL_MONTHS[exportMonth - 1]} ${year}`);

      // Style the header
      const colWidths = [
        { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 14 },
        { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 20 },
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `Fees_${FULL_MONTHS[exportMonth - 1]}_${year}.xlsx`);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  // Group students by batch
  const grouped = {};
  students.forEach(s => {
    const key = s.batch_name || 'No Batch';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
          <p className="text-text-secondary text-sm mt-1">Year-at-a-glance fee status matrix</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="form-select w-auto" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Export Section */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-secondary font-medium">Export to Excel:</span>
        <select className="form-select w-auto" value={exportMonth} onChange={e => setExportMonth(parseInt(e.target.value))}>
          {FULL_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <span className="text-sm text-text-muted">{year}</span>
        <button className="btn btn-primary btn-sm" onClick={handleExport}>
          <Download size={14} /> Download Excel
        </button>
      </div>

      {/* Matrix Table */}
      {students.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-text-muted">No students found. Add students in the Batches page.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-tertiary/50">
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary sticky left-0 bg-bg-tertiary/90 backdrop-blur-sm z-10 min-w-[160px]">Student</th>
                  {MONTH_NAMES.map((m, i) => (
                    <th key={i} className="text-center px-2 py-3 font-semibold text-text-secondary min-w-[52px]">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(grouped).map(([batchName, batchStudents]) => (
                  <>
                    {/* Batch Separator */}
                    <tr key={`batch-${batchName}`}>
                      <td colSpan={13} className="px-4 py-2 bg-bg-primary/50 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        {batchName}
                      </td>
                    </tr>
                    {batchStudents.map(student => (
                      <tr key={student.id} className="hover:bg-bg-tertiary/20 transition-colors">
                        <td className="px-4 py-2.5 sticky left-0 bg-bg-secondary/90 backdrop-blur-sm z-10">
                          <p className="font-medium truncate">{student.name}</p>
                          <p className="text-xs text-text-muted">₹{student.monthly_fee}/mo</p>
                        </td>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                          const status = getStatus(student.id, m);
                          return (
                            <td key={m} className="text-center px-1 py-2.5">
                              {status ? (
                                <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                  status.status === 'paid' ? 'bg-success-light text-success' :
                                  status.status === 'partial' ? 'bg-warning-light text-warning' :
                                  'bg-danger-light text-danger'
                                }`} title={
                                  status.status === 'paid' ? `Paid ₹${status.total_paid}` :
                                  status.status === 'partial' ? `Partial: ₹${status.total_paid}/${status.monthly_fee}` :
                                  'Not paid'
                                }>
                                  {status.status === 'paid' ? <Check size={14} /> :
                                   status.status === 'partial' ? <AlertTriangle size={14} /> :
                                   <X size={14} />}
                                </div>
                              ) : (
                                <div className="w-8 h-8 mx-auto rounded-lg bg-bg-tertiary/30 flex items-center justify-center">
                                  <span className="text-text-muted text-xs">—</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-text-muted pl-1">
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-success-light flex items-center justify-center"><Check size={10} className="text-success" /></div> Paid</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-warning-light flex items-center justify-center"><AlertTriangle size={10} className="text-warning" /></div> Partial</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-danger-light flex items-center justify-center"><X size={10} className="text-danger" /></div> Pending</div>
      </div>
    </div>
  );
}
