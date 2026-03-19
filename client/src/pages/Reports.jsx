import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { fetchBatches, fetchStudents, fetchFeeStatus, exportFeesAdvanced } from '../api';

const MONTH_NAMES_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [students, setStudents] = useState([]);
  const [monthData, setMonthData] = useState({});
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [filterBatch, setFilterBatch] = useState('all');

  useEffect(() => {
    loadAllData();
  }, [year]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [studentList, batchList] = await Promise.all([fetchStudents(), fetchBatches()]);
      setStudents(studentList);
      setBatches(batchList);

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
      const blob = await exportFeesAdvanced(year);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TutorFlow_Export_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  // Filter students
  const filteredStudents = filterBatch === 'all'
    ? students
    : students.filter(s => s.batch_id === filterBatch);

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
          <p className="text-text-secondary text-sm mt-1">Year-at-a-glance fee status matrix.</p>
        </div>
        <select className="form-select w-auto min-w-[100px]" value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Export Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-secondary">Export:</span>
        <select className="form-select w-auto min-w-[140px]" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          <option value="all">All Batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex-1" />
        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          <Download size={14} /> Download Excel
        </button>
      </div>

      {/* Matrix Table */}
      {filteredStudents.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-text-muted">No students found.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 sm:px-5 py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider sticky left-0 bg-bg-secondary z-10 min-w-[130px] sm:min-w-[180px]">Student Name</th>
                  {MONTH_NAMES_SHORT.map((m, i) => (
                    <th key={i} className="text-center px-1.5 sm:px-3 py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider min-w-[40px] sm:min-w-[60px]">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-bg-tertiary/20 transition-colors">
                    <td className="px-3 sm:px-5 py-2.5 sm:py-3 sticky left-0 bg-bg-secondary z-10 border-r border-border/30">
                      <p className="font-medium text-xs sm:text-sm truncate max-w-[110px] sm:max-w-none">{student.name}</p>
                      <p className="text-[10px] sm:text-xs text-text-muted truncate max-w-[110px] sm:max-w-none">{student.batch_name}</p>
                    </td>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                      const status = getStatus(student.id, m);
                      let dotColor = 'bg-border'; // default gray
                      let title = 'No data';
                      
                      const isFuture = year > now.getFullYear() || (year === now.getFullYear() && m > now.getMonth() + 1);

                      if (status) {
                        if (status.status === 'paid') {
                          dotColor = 'bg-success';
                          title = `Paid ₹${status.total_paid}`;
                        } else if (status.status === 'partial') {
                          dotColor = 'bg-warning';
                          title = `Partial: ₹${status.total_paid}/${status.monthly_fee}`;
                        } else if (status.status === 'pending') {
                          if (!isFuture) {
                            dotColor = 'bg-danger';
                            title = `Pending ₹${status.monthly_fee}`;
                          } else {
                            title = `Upcoming ₹${status.monthly_fee}`;
                          }
                        }
                      }
                      return (
                        <td key={m} className="text-center px-1.5 sm:px-3 py-2.5 sm:py-3 border-l border-border/10">
                          <div
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mx-auto ${dotColor} transition-all`}
                            title={title}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-text-muted pl-1">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-success" /> Paid</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-warning" /> Partial</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-danger" /> Pending</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-border" /> No data</div>
      </div>
    </div>
  );
}
