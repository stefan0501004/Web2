import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTravelPlan } from '../context/TravelPlanContext';
import Navbar from '../components/common/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import TravelPlanForm from '../components/travel-plans/TravelPlanForm';
import DestinationsTab from '../components/destinations/DestinationsTab';
import ActivitiesTab from '../components/activities/ActivitiesTab';
import ExpensesTab from '../components/expenses/ExpensesTab';
import ChecklistTab from '../components/checklist/ChecklistTab';
import SharingTab from '../components/sharing/SharingTab';

const TABS = ['Overview', 'Destinations', 'Activities', 'Expenses', 'Checklist', 'Sharing'];

export default function TravelPlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentPlan, loading, error, fetchPlan, updatePlan, removePlan } = useTravelPlan();
  const [activeTab, setActiveTab] = useState('Overview');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => { fetchPlan(id); }, [id, fetchPlan]);

  const handleUpdate = async (data) => {
    setEditError('');
    try {
      await updatePlan(id, data);
      setEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update plan.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this travel plan and all its data?')) return;
    try {
      await removePlan(id);
      navigate('/dashboard');
    } catch {
      alert('Failed to delete plan.');
    }
  };

  if (loading) return <><Navbar /><LoadingSpinner /></>;
  if (error) return <><Navbar /><div className="container mt-4"><ErrorMessage message={error} /></div></>;
  if (!currentPlan) return null;

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <button className="btn btn-sm btn-link text-muted p-0 mb-3" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h2 className="fw-bold mb-1">{currentPlan.name}</h2>
            <p className="text-muted mb-0">{currentPlan.startDate} → {currentPlan.endDate}</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>Delete</button>
          </div>
        </div>

        {editing && (
          <div className="card my-3">
            <div className="card-body">
              <h5>Edit Plan</h5>
              <ErrorMessage message={editError} />
              <TravelPlanForm initial={currentPlan} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />
            </div>
          </div>
        )}

        <ul className="nav nav-tabs mt-3 mb-4">
          {TABS.map(tab => (
            <li key={tab} className="nav-item">
              <button
                className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >{tab}</button>
            </li>
          ))}
        </ul>

        {activeTab === 'Overview' && <OverviewTab plan={currentPlan} />}
        {activeTab === 'Destinations' && <DestinationsTab planId={id} />}
        {activeTab === 'Activities' && <ActivitiesTab planId={id} />}
        {activeTab === 'Expenses' && <ExpensesTab planId={id} />}
        {activeTab === 'Checklist' && <ChecklistTab planId={id} />}
        {activeTab === 'Sharing' && <SharingTab planId={id} />}
      </div>
    </>
  );
}

function OverviewTab({ plan }) {
  return (
    <div>
      <div className="d-flex flex-wrap gap-3 mb-3">
        <div className="flex-fill text-center p-3 rounded text-white" style={{ background: 'linear-gradient(160deg, #1f6f5c, #124a3d)' }}>
          <p className="small mb-1 opacity-75">Budget</p>
          <h4 className="mb-0">${plan.budget.toLocaleString()}</h4>
        </div>
        <div className="flex-fill text-center p-3 rounded border">
          <p className="text-muted small mb-1">Start</p>
          <h5 className="mb-0">{plan.startDate}</h5>
        </div>
        <div className="flex-fill text-center p-3 rounded border">
          <p className="text-muted small mb-1">End</p>
          <h5 className="mb-0">{plan.endDate}</h5>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Details</h5>
          {plan.description && <p>{plan.description}</p>}
          {plan.notes && <><hr /><p className="text-muted">{plan.notes}</p></>}
        </div>
      </div>
    </div>
  );
}
