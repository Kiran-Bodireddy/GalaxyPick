import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const Ctx = createContext(null);

export const GalaxyProvider = ({ children }) => {
  const [persona, setPersona] = useState(null);
  const [needs, setNeeds] = useState([]);
  const [budget, setBudget] = useState(null);
  const [preferences, setPreferences] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [location, setLocation] = useState({ currency: 'INR', country: 'India' });
  const [userName, setUserName] = useState('Friend');

  useEffect(() => {
    axios.get(`${API}/location`).then(r => setLocation(r.data)).catch(() => {});
  }, []);

  const reset = () => {
    setPersona(null); setNeeds([]); setBudget(null); setPreferences([]); setRecommendations([]);
  };

  const fetchRecommendations = async () => {
    const { data } = await axios.post(`${API}/recommend`, { persona, needs, budget, preferences });
    setRecommendations(data.recommendations);
    return data.recommendations;
  };

  return (
    <Ctx.Provider value={{
      persona, setPersona, needs, setNeeds, budget, setBudget,
      preferences, setPreferences, recommendations, fetchRecommendations,
      location, userName, setUserName, reset, API,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useGalaxy = () => useContext(Ctx);
