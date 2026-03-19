import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, ChevronDown, ChevronRight, MapPin, Clock, Building2, Home } from 'lucide-react';
import Modal from '../components/Modal';
import { fetchBatches, createBatch, updateBatch, deleteBatch, fetchStudents, createStudent, updateStudent, deleteStudent } from '../api';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState({});
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [batchModal, setBatchModal] = useState({ open: false, editing: null });
  const [studentModal, setStudentModal] = useState({ open: false, editing: null, batchId: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, item: null });

  // Form states
  const [batchForm, setBatchForm] = useState({ name: '', type: 'coaching', location: '', timing: '' });
  const [studentForm, setStudentForm] = useState({ name: '', phone: '', monthly_fee: '' });

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const data = await fetchBatches();
      setBatches(data);
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

  const toggleBatch = (batchId) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
    } else {
      setExpandedBatch(batchId);
      if (!students[batchId]) loadStudents(batchId);
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
        loadStudents(deleteModal.item.batch_id);
        loadBatches();
      }
      setDeleteModal({ open: false, type: null, item: null });
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
    const isExpanded = expandedBatch === batch.id;
    const batchStudents = students[batch.id] || [];

    return (
      <div key={batch.id} className="glass-card overflow-hidden animate-fade-in">
        {/* Batch Header */}
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-bg-tertiary/50 transition-colors"
          onClick={() => toggleBatch(batch.id)}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${batch.type === 'coaching' ? 'bg-indigo-light text-indigo' : 'bg-accent-light text-accent'}`}>
              {batch.type === 'coaching' ? <Building2 size={18} /> : <Home size={18} />}
            </div>
            <div>
              <h3 className="font-semibold text-sm md:text-base">{batch.name}</h3>
              <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                {batch.location && (
                  <>
                    <MapPin size={12} /> {batch.location}
                    <span>·</span>
                  </>
                )}
                {batch.timing && (
                  <>
                    <Clock size={12} /> {batch.timing}
                    <span>·</span>
                  </>
                )}
                <Users size={12} /> {batch.student_count} students
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openBatchModal(batch); }}>
              <Edit2 size={14} />
            </button>
            <button className="btn-icon hover:!text-danger hover:!border-danger" onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, type: 'batch', item: batch }); }}>
              <Trash2 size={14} />
            </button>
            {isExpanded ? <ChevronDown size={18} className="text-text-muted" /> : <ChevronRight size={18} className="text-text-muted" />}
          </div>
        </div>

        {/* Student List (Expanded) */}
        {isExpanded && (
          <div className="border-t border-border bg-bg-primary/50">
            <div className="p-3">
              <button className="btn btn-secondary btn-sm w-full justify-center" onClick={() => openStudentModal(batch.id)}>
                <Plus size={14} /> Add Student
              </button>
            </div>
            {batchStudents.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-4">No students in this batch</p>
            ) : (
              <div className="divide-y divide-border">
                {batchStudents.map(student => (
                  <div key={student.id} className="px-4 py-3 flex items-center justify-between hover:bg-bg-tertiary/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-text-muted">
                        {student.phone && `${student.phone} · `}₹{student.monthly_fee}/month
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="btn-icon" onClick={() => openStudentModal(batch.id, student)}>
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-icon hover:!text-danger hover:!border-danger" onClick={() => setDeleteModal({ open: true, type: 'student', item: student })}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Batches & Students</h1>
          <p className="text-text-secondary text-sm mt-1">{batches.length} batches · {batches.reduce((s, b) => s + b.student_count, 0)} students</p>
        </div>
        <button className="btn btn-primary" onClick={() => openBatchModal()}>
          <Plus size={18} />
          <span className="hidden sm:inline">New Batch</span>
        </button>
      </div>

      {/* Coaching Section */}
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          <Building2 size={16} /> Mindcrest / Coaching
        </h2>
        {coachingBatches.length === 0 ? (
          <p className="text-text-muted text-sm glass-card p-6 text-center">No coaching batches yet. Create one!</p>
        ) : (
          <div className="space-y-3">{coachingBatches.map(renderBatchCard)}</div>
        )}
      </div>

      {/* Home Tuition Section */}
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          <Home size={16} /> Home Tuition
        </h2>
        {homeBatches.length === 0 ? (
          <p className="text-text-muted text-sm glass-card p-6 text-center">No home tuition groups yet. Create one!</p>
        ) : (
          <div className="space-y-3">{homeBatches.map(renderBatchCard)}</div>
        )}
      </div>

      {/* ── Batch Modal ──────────────────────────── */}
      <Modal
        isOpen={batchModal.open}
        onClose={() => setBatchModal({ open: false, editing: null })}
        title={batchModal.editing ? 'Edit Batch' : 'Create Batch'}
      >
        <form onSubmit={handleBatchSubmit} className="space-y-4">
          <div>
            <label className="form-label">Batch Name</label>
            <input className="form-input" placeholder="e.g. Mindcrest Batch A" value={batchForm.name} onChange={e => setBatchForm(p => ({ ...p, name: e.target.value }))} required />
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
            <input className="form-input" placeholder="e.g. Mon/Wed/Fri 4-5 PM" value={batchForm.timing} onChange={e => setBatchForm(p => ({ ...p, timing: e.target.value }))} />
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
            <input className="form-input" placeholder="e.g. Rahul Sharma" value={studentForm.name} onChange={e => setStudentForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Phone (optional)</label>
            <input className="form-input" placeholder="e.g. 9876543210" value={studentForm.phone} onChange={e => setStudentForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Monthly Fee (₹)</label>
            <input className="form-input" type="number" min="0" placeholder="e.g. 2000" value={studentForm.monthly_fee} onChange={e => setStudentForm(p => ({ ...p, monthly_fee: e.target.value }))} />
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
