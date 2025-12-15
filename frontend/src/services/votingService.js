const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'x-auth-token': token
  };
};

export const createEvent = async (eventData) => {
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(eventData),
  });
  if (!response.ok) throw new Error('Failed to create event');
  return response.json();
};

export const getEvents = async () => {
  const response = await fetch(`${API_BASE_URL}/events`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
};

export const getEventById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/events/${id}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch event');
  return response.json();
};

export const getEventsByCreator = async (userId) => {
  // Note: userId is ignored here as the backend uses the token to identify the creator
  const response = await fetch(`${API_BASE_URL}/events/created`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch created events');
  return response.json();
};

export const getVotedEvents = async (userId) => {
  // Fetches votes and extracts events
  const response = await fetch(`${API_BASE_URL}/votes/mine`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch voted events');
  const votes = await response.json();

  // Map votes to a structure similar to events, or just return votes with populated events
  // For MyVotedActivitiesPage, it likely expects a list of items.
  // Let's return the events enriched with my vote status
  return votes.map(vote => ({
    ...vote.event,
    myVoteStatus: vote.status,
    myVoteCandidateId: vote.candidateId
  }));
};

export const castVote = async (voteData) => {
  const response = await fetch(`${API_BASE_URL}/votes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(voteData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || 'Failed to submit vote');
  }
  return data;
};

export const getPendingVotes = async (eventId) => {
  const response = await fetch(`${API_BASE_URL}/votes/event/${eventId}/pending`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch pending votes');
  return response.json();
};

export const evaluateVote = async (voteId, status) => {
  const response = await fetch(`${API_BASE_URL}/votes/${voteId}/evaluate`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to evaluate vote');
  return response.json();
};

export const getVoteStatus = async (eventId) => {
  const response = await fetch(`${API_BASE_URL}/votes/status/${eventId}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch vote status');
  return response.json();
};
// NEW Verification Flow Methods

export const requestVerification = async (eventId, identityData, blindedMessage) => {
  const response = await fetch(`${API_BASE_URL}/verification/request`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ eventId, identityData, blindedMessage }),
  });
  if (!response.ok) {
     const errorData = await response.json();
     throw new Error(errorData.msg || 'Failed to request verification');
  }
  return response.json();
};

export const checkVerificationStatus = async (eventId) => {
  const response = await fetch(`${API_BASE_URL}/verification/status/${eventId}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch verification status');
  return response.json();
};

export const getPendingVerifications = async (eventId) => {
  const response = await fetch(`${API_BASE_URL}/verification/pending/${eventId}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch pending verifications');
  return response.json();
};

export const approveVerification = async (requestId) => {
  const response = await fetch(`${API_BASE_URL}/verification/approve/${requestId}`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  if (!response.ok) {
     const errorData = await response.json();
     throw new Error(errorData.msg || 'Failed to approve verification');
  }
  return response.json();
};

export const rejectVerification = async (requestId) => {
  const response = await fetch(`${API_BASE_URL}/verification/reject/${requestId}`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to reject verification');
  return response.json();
};

export const updateEventStatus = async (eventId, status, tallyResults = null) => {
    const body = { status };
    if (tallyResults) body.tallyResults = tallyResults;

    const response = await fetch(`${API_BASE_URL}/events/${eventId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Failed to update event status');
    return response.json();
  };

export const getRejectedWallets = async (eventId) => {
  const response = await fetch(`${API_BASE_URL}/votes/event/${eventId}/rejected-wallets`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch rejected wallets');
  return response.json();
};
