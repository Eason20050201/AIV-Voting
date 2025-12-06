import { useState } from 'react';
import { mockAuthService } from '../services/mockAuthService';
import { useAuth } from '../context/AuthContext';

export const useVerification = () => {
  const { user, updateUser } = useAuth();
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const submitKyc = async (formData) => {
    if (!user) {
      setError("User not logged in");
      return { success: false };
    }

    setUploading(true);
    setError(null);

    try {
      // formData should contain name, idNumber, etc.
      // For mock service we just pass an object.
      const verificationData = {
        name: formData.get('realName'),
        idNumber: formData.get('idNumber'),
        // In real app we would upload file here.
      };

      const response = await mockAuthService.submitVerification(user.id, verificationData);
      
      if (response.success) {
        // Update the user in AuthContext to reflect the new status
        updateUser(response.user);
        
        return { success: true, user: response.user };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUploading(false);
    }
  };

  return { submitKyc, uploading, error };
};
