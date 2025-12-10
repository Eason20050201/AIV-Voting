import React from 'react';
import { useAuth } from '../context/AuthContext';
import MyCreatedVotingsPage from './MyCreatedVotingsPage';
import MyVotedActivitiesPage from './MyVotedActivitiesPage';

const MyVotingsPage = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'organizer') {
    return <MyCreatedVotingsPage />;
  }

  return <MyVotedActivitiesPage />;
};

export default MyVotingsPage;
