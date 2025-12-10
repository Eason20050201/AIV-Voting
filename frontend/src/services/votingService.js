// This service is a placeholder until backend Voting APIs are implemented.
// Currently returns empty data to prevent frontend crashes.

export const getEvents = () => {
  return Promise.resolve([]);
};

export const getEventById = (id) => {
  return Promise.resolve(null);
};

export const createEvent = (eventData) => {
  console.warn("Backend createEvent not implemented.");
  return Promise.resolve({ ...eventData, id: Date.now() });
};

export const getEventsByCreator = (userId) => {
  return Promise.resolve([]);
};

export const getVotedEvents = (userId) => {
  return Promise.resolve([]);
};
