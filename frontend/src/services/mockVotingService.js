// Simulate a database
let events = [
  {
    id: 1,
    title: "Annual Tech Conference 2025",
    description: "Vote for the best keynote speaker and workshop topics.",
    status: "Active",
    votes: 1250,
    endDate: "2025-12-10",
    color: "from-indigo-500 to-purple-500",
    creatorId: "admin", // Sample creator
    candidates: [
      { id: 'c1', name: "Alice Chen", role: "AI Researcher", description: "Speaking on: The Future of LLMs" },
      { id: 'c2', name: "Bob Smith", role: "Cloud Architect", description: "Speaking on: Serverless at Scale" },
      { id: 'c3', name: "Carol Wu", role: "UX Designer", description: "Speaking on: Empathy in Design" }
    ]
  },
  {
    id: 2,
    title: "Employee of the Month",
    description: "Cast your vote for the most outstanding team member of November.",
    status: "Ending Soon",
    votes: 85,
    endDate: "2025-12-05",
    color: "from-fuchsia-500 to-pink-500",
    creatorId: "admin",
    candidates: [
      { id: 'e1', name: "David Miller", role: "Frontend Dev", description: "Led the dashboard redesign." },
      { id: 'e2', name: "Eva Zhang", role: "Product Manager", description: "Successfully launched 3 features." }
    ]
  },
  {
    id: 3,
    title: "Office Lunch Menu",
    description: "Decide on the catering options for next week's team lunch.",
    status: "Active",
    votes: 42,
    endDate: "2025-12-07",
    color: "from-blue-500 to-cyan-500",
    creatorId: "user1",
    candidates: [
      { id: 'f1', name: "Pizza Party", role: "Italian", description: "Assorted pizzas and salads." },
      { id: 'f2', name: "Taco Tuesday", role: "Mexican", description: "Build your own tacos." },
      { id: 'f3', name: "Sushi Platter", role: "Japanese", description: "Fresh sushi and rolls." }
    ]
  }
];

const COLORS = [
  "from-indigo-500 to-purple-500",
  "from-fuchsia-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-violet-500 to-fuchsia-500"
];

export const getEvents = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...events]);
    }, 500);
  });
};

export const getEventById = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const event = events.find(e => e.id === parseInt(id));
      resolve(event);
    }, 500);
  });
};

export const createEvent = (eventData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newEvent = {
        ...eventData,
        id: Date.now(), // Simple ID generation
        votes: 0,
        status: "Active",
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
      events = [newEvent, ...events];
      resolve(newEvent);
    }, 800);
  });
};

export const getEventsByCreator = (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userEvents = events.filter(e => e.creatorId === userId);
      resolve(userEvents);
    }, 500);
  });
};
