import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../services/mockVotingService';
import { useAuth } from '../context/AuthContext';
import './CreateVotingPage.css';
import Button from '../components/ui/Button';

const CreateVotingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    endDate: '',
    candidates: [
      { id: Date.now(), name: '', role: '', description: '' },
      { id: Date.now() + 1, name: '', role: '', description: '' }
    ]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCandidateChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  const addCandidate = () => {
    setFormData(prev => ({
      ...prev,
      candidates: [...prev.candidates, { id: Date.now(), name: '', role: '', description: '' }]
    }));
  };

  const removeCandidate = (id) => {
    if (formData.candidates.length <= 2) {
      alert("You need at least 2 candidates!");
      return;
    }
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.filter(c => c.id !== id)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.endDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const isValidCandidates = formData.candidates.every(c => c.name && c.role);
    if (!isValidCandidates) {
      alert("Please fill in Name and Role for all candidates.");
      return;
    }

    setLoading(true);
    try {
      await createEvent({
        ...formData,
        creatorId: user.username // Use logged in user's username
      });
      navigate('/');
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-voting-container">
      <div className="create-voting-content glass-panel">
        <h1 className="page-title">Create New Voting</h1>
        
        <form onSubmit={handleSubmit} className="voting-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Annual Team Building"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe what this vote is about..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="candidates-section">
            <h2 className="section-subtitle">Candidates / Options</h2>
            <div className="candidate-list">
              {formData.candidates.map((candidate, index) => (
                <div key={candidate.id} className="candidate-item">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Name / Option"
                      value={candidate.name}
                      onChange={(e) => handleCandidateChange(candidate.id, 'name', e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Role / Category"
                      value={candidate.role}
                      onChange={(e) => handleCandidateChange(candidate.id, 'role', e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Short Description"
                      value={candidate.description}
                      onChange={(e) => handleCandidateChange(candidate.id, 'description', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeCandidate(candidate.id)}
                    className="remove-btn"
                    title="Remove Candidate"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <Button 
              type="button" 
              variant="secondary" 
              fullWidth 
              onClick={addCandidate}
              className="add-candidate-btn"
            >
              + Add Another Candidate
            </Button>
          </div>

          <div className="form-actions">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Voting'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVotingPage;
