import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Clock, Users, Building2, Home } from 'lucide-react';
import Modal from '../components/Modal';
import { fetchBatches, createBatch, updateBatch, deleteBatch, fetchStudents, createStudent, updateStudent, deleteStudent } from '../api';

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(name) {
  return name?.charAt(0)?.toUpperCase() || '?';
}

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);

  // Modal states
  const [batchModal, setBatchModal] = useState({ open: false, editing: null });
  const [studentModal, setStudentModal] = useState({ open: false, editing: null, batchId: null });
  const [studentListModal, setStudentListModal] = useState({ open: false, batch: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, item: null });

  // Form states
  const [batchForm, setBatchForm] = useState({ name: '', type: 'coaching', location: '', timing: '' });
  const [studentForm, setStudentForm] = useState({ name: '', phone: '', monthly_fee: '' });

  useEffect(() => {
    loadBatches();
    const handleClick = () => setMenuOpen(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const loadBatches = async () => {
    try {
      const data = await fetchBatches();
      setBatches(data);
      // Pre-load students for avatar display
      for (const batch of data) {
        loadStudents(batch.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (batchId) => {
    try {
      const data = await fetchStudents(batchId);
      setStudents(prev => ({ ...prev, [batchId]: data }));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Batch CRUD ────────────────────────────────

  const openBatchModal = (batch = null) => {
    if (batch) {
      setBatchForm({ name: batch.name, type: batch.type, location: batch.location || '', timing: batch.timing || '' });
      setBatchModal({ open: true, editing: batch });
    } else {
      setBatchForm({ name: '', type: 'coaching', location: '', timing: '' });
      setBatchModal({ open: true, editing: null });
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    try {
      if (batchModal.editing) {
        await updateBatch(batchModal.editing.id, batchForm);
      } else {
        await createBatch(batchForm);
      }
      setBatchModal({ open: false, editing: null });
      loadBatches();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Student CRUD ──────────────────────────────

  const openStudentModal = (batchId, student = null) => {
    if (student) {
      setStudentForm({ name: student.name, phone: student.phone || '', monthly_fee: student.monthly_fee || '' });
      setStudentModal({ open: true, editing: student, batchId });
    } else {
      setStudentForm({ name: '', phone: '', monthly_fee: '' });
      setStudentModal({ open: true, editing: null, batchId });
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...studentForm,
      monthly_fee: parseFloat(studentForm.monthly_fee) || 0,
      batch_id: studentModal.batchId,
    };
    try {
      if (studentModal.editing) {
        await updateStudent(studentModal.editing.id, data);
      } else {
        await createStudent(data);
      }
      setStudentModal({ open: false, editing: null, batchId: null });
      loadStudents(studentModal.batchId);
      loadBatches();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Delete ────────────────────────────────────

  const handleDelete = async () => {
    try {
      if (deleteModal.type === 'batch') {
        await deleteBatch(deleteModal.item.id);
        loadBatches();
      } else {
        await deleteStudent(deleteModal.item.id);
        if (deleteModal.item.batch_id) {
          loadStudents(deleteModal.item.batch_id);
        }
        loadBatches();
      }
      setDeleteModal({ open: false, type: null, item: null });
      setStudentListModal({ open: false, batch: null });
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Render ────────────────────────────────────

  const coachingBatches = batches.filter(b => b.type === 'coaching');
  const homeBatches = batches.filter(b => b.type === 'home');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderBatchCard = (batch) => {
    const batchStudents = students[batch.id] || [];
    const displayStudents = batchStudents.slice(0, 3);
    const extraCount = Math.max(0, batchStudents.length - 3);

    return (
      <div key={batch.id} className={`glass-card p-5 animate-fade-in flex flex-col justify-between min-h-[160px] relative group ${menuOpen === batch.id ? 'z-30' : 'z-10'}`}>
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-[15px] leading-snug pr-6">{batch.name}</h3>
            <div className="relative">
              <button
                className="p-1 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === batch.id ? null : batch.id); }}
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen === batch.id && (
                <div className="absolute right-0 top-8 w-40 bg-bg-secondary border border-border rounded-xl shadow-2xl z-20 py-1 animate-scale-in">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-bg-tertiary transition-colors" onClick={() => { setMenuOpen(null); setStudentListModal({ open: true, batch }); loadStudents(batch.id); }}>View Students</button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-bg-tertiary transition-colors" onClick={() => { setMenuOpen(null); openStudentModal(batch.id); }}>Add Student</button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-bg-tertiary transition-colors" onClick={() => { setMenuOpen(null); openBatchModal(batch); }}>Edit Batch</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger-light transition-colors" onClick={() => { setMenuOpen(null); setDeleteModal({ open: true, type: 'batch', item: batch }); }}>Delete Batch</button>
                </div>
              )}
            </div>
          </div>
          {/* Timing */}
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {batch.timing && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {batch.timing}
              </span>
            )}
          </div>
        </div>

        {/* Footer: Avatars + Count */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center -space-x-1.5">
            {displayStudents.map((st, i) => (
              <div key={st.id} className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-bg-secondary ${getAvatarColor(st.name)}`}>
                {getInitial(st.name)}
              </div>
            ))}
            {extraCount > 0 && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-bg-secondary bg-bg-tertiary text-text-secondary">
                +{extraCount}
              </div>
            )}
          </div>
          <span className="text-xs text-text-secondary font-medium">{batch.student_count} Students</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">Batches &<br className="sm:hidden" /> Students</h1>
          <p className="text-text-secondary text-[11px] sm:text-sm mt-1">Manage your classes and enrollments.</p>
        </div>
        <button className="btn btn-primary py-2 px-3.5 text-xs sm:py-2.5 sm:px-5 sm:text-sm shrink-0" onClick={() => openBatchModal()}>
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
          New Batch
        </button>
      </div>

      {/* Coaching Section */}
      <div>
        <h2 className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
          <Building2 size={14} /> Coaching
        </h2>
        {coachingBatches.length === 0 ? (
          <p className="text-text-muted text-sm glass-card p-8 text-center">No coaching batches yet. Create one!</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{coachingBatches.map(renderBatchCard)}</div>
        )}
      </div>

      {/* Home Tuition Section */}
      <div>
        <h2 className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
          <Home size={14} /> Home Tuition
        </h2>
        {homeBatches.length === 0 ? (
          <p className="text-text-muted text-sm glass-card p-8 text-center">No home tuition groups yet. Create one!</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{homeBatches.map(renderBatchCard)}</div>
        )}
      </div>

      {/* ── Student List Modal ────────────────────── */}
      <Modal
        isOpen={studentListModal.open}
        onClose={() => setStudentListModal({ open: false, batch: null })}
        title={studentListModal.batch ? `${studentListModal.batch.name} — Students` : 'Students'}
        size="md"
      >
        {studentListModal.batch && (
          <div>
            <button className="btn btn-secondary btn-sm w-full justify-center mb-4" onClick={() => { setStudentListModal({ open: false, batch: null }); openStudentModal(studentListModal.batch.id); }}>
              <Plus size={14} /> Add Student
            </button>
            {(students[studentListModal.batch.id] || []).length === 0 ? (
              <p className="text-text-muted text-sm text-center py-4">No students in this batch</p>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {(students[studentListModal.batch.id] || []).map(student => (
                  <div key={student.id} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-bg-tertiary/40 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(student.name)}`}>
                      {getInitial(student.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-text-muted">{student.phone && `${student.phone} · `}₹{student.monthly_fee}/mo</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="btn-icon" style={{ padding: '4px' }} onClick={() => { setStudentListModal({ open: false, batch: null }); openStudentModal(studentListModal.batch.id, student); }}>
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Batch Modal ──────────────────────────── */}
      <Modal
        isOpen={batchModal.open}
        onClose={() => setBatchModal({ open: false, editing: null })}
        title={batchModal.editing ? 'Edit Batch' : 'Create Batch'}
      >
        <form onSubmit={handleBatchSubmit} className="space-y-4">
          <div>
            <label className="form-label">Batch Name</label>
            <input className="form-input" placeholder="e.g. Class 10 - Maths Masterclass" value={batchForm.name} onChange={e => setBatchForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" value={batchForm.type} onChange={e => setBatchForm(p => ({ ...p, type: e.target.value }))}>
              <option value="coaching">Coaching Centre</option>
              <option value="home">Home Tuition</option>
            </select>
          </div>
          <div>
            <label className="form-label">Location (optional)</label>
            <input className="form-input" placeholder="e.g. Mindcrest, Sector 5" value={batchForm.location} onChange={e => setBatchForm(p => ({ ...p, location: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Batch Timing (optional)</label>
            <input className="form-input" placeholder="e.g. Mon, Wed, Fri · 5:00 PM" value={batchForm.timing} onChange={e => setBatchForm(p => ({ ...p, timing: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => setBatchModal({ open: false, editing: null })}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1">{batchModal.editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* ── Student Modal ────────────────────────── */}
      <Modal
        isOpen={studentModal.open}
        onClose={() => setStudentModal({ open: false, editing: null, batchId: null })}
        title={studentModal.editing ? 'Edit Student' : 'Add Student'}
      >
        <form onSubmit={handleStudentSubmit} className="space-y-4">
          <div>
            <label className="form-label">Student Name</label>
            <input className="form-input" placeholder="e.g. Aarav Patel" value={studentForm.name} onChange={e => setStudentForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Phone (optional)</label>
            <input className="form-input" placeholder="e.g. 9876543210" value={studentForm.phone} onChange={e => setStudentForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Monthly Fee (₹)</label>
            <input className="form-input" type="number" min="0" placeholder="e.g. 2500" value={studentForm.monthly_fee} onChange={e => setStudentForm(p => ({ ...p, monthly_fee: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => setStudentModal({ open: false, editing: null, batchId: null })}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1">{studentModal.editing ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ──────────────────── */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: null, item: null })}
        title="Confirm Delete"
        size="sm"
      >
        <p className="text-text-secondary text-sm mb-4">
          Are you sure you want to delete <strong className="text-text-primary">{deleteModal.item?.name}</strong>?
          {deleteModal.type === 'batch' && ' This will also delete all students and their fee records in this batch.'}
          {deleteModal.type === 'student' && ' This will also delete all fee records for this student.'}
        </p>
        <div className="flex gap-3">
          <button className="btn btn-secondary flex-1" onClick={() => setDeleteModal({ open: false, type: null, item: null })}>Cancel</button>
          <button className="btn btn-danger flex-1" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
