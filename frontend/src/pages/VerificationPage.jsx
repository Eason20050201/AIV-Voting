import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useVerification } from '../hooks/useVerification';
import { useAuth } from '../context/AuthContext';
import './VerificationPage.css';

const VerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { submitKyc, uploading, error } = useVerification();
  
  const [formData, setFormData] = useState({
    realName: '',
    idNumber: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Get redirect path from URL query params
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/';

  useEffect(() => {
    // If user is already verified, redirect immediately
    if (user?.kycStatus === 'verified') {
      navigate(redirectPath);
    }
    
    // Cleanup preview URL on unmount
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [user, navigate, redirectPath]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation(); // Prevent triggering file input
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      // You might want to show an error or just proceed if file is optional
      // For this demo, let's require it
      // alert("Please upload an ID photo"); 
      // Better to set error state if we had one for file
      return; 
    }

    // Create form data object to simulate file upload
    const uploadData = new FormData();
    uploadData.append('realName', formData.realName);
    uploadData.append('idNumber', formData.idNumber);
    uploadData.append('idPhoto', selectedFile); 

    const result = await submitKyc(uploadData);
    
    if (result.success) {
      navigate(redirectPath);
    }
  };

  return (
    <div className="verification-page-container">
      <div className="verification-card glass-panel">
        <div className="verification-header">
          <h2>Identity Verification</h2>
          <Badge>Required</Badge>
        </div>
        
        <p className="verification-description">
          To ensure fair voting and platform integrity, please verify your real identity. 
          Your information is secure and used only for verification purposes.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="verification-form">
          <div className="form-group">
            <label htmlFor="realName">Real Name</label>
            <input
              type="text"
              id="realName"
              name="realName"
              value={formData.realName}
              onChange={handleChange}
              required
              placeholder="Enter your full legal name"
              className="glass-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="idNumber">ID Number</label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              required
              placeholder="Enter your ID number"
              className="glass-input"
            />
          </div>

          <div className="form-group">
            <label>ID Card Photo</label>
            <div 
              className={`file-upload-area ${previewUrl ? 'has-preview' : ''}`}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input 
                type="file" 
                id="fileInput" 
                accept="image/*" 
                onChange={handleFileChange} 
                hidden 
              />
              
              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="ID Preview" className="preview-image" />
                  <button type="button" className="remove-file-btn" onClick={handleRemoveFile}>
                    ×
                  </button>
                  <span className="file-name">{selectedFile.name}</span>
                </div>
              ) : (
                <>
                  <span className="upload-icon">📄</span>
                  <span className="upload-text">Click to upload ID Photo</span>
                  <span className="upload-hint">Supported formats: JPG, PNG</span>
                </>
              )}
            </div>
          </div>

          <div className="verification-actions">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate(-1)} 
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Verifying...' : 'Submit Verification'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationPage;
