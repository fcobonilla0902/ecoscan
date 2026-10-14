import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ecoscan:v1';
const POINTS_PER_RECYCLE = 10;

export const CHALLENGES = [
  { id: 'ch1', title: 'Primeros pasos', desc: 'Recicla 3 residuos', goal: 3, reward: 20, metric: (h) => h.length },
  { id: 'ch2', title: 'Rey del vidrio', desc: 'Recicla 3 objetos de vidrio', goal: 3, reward: 30, metric: (h) => h.filter((x) => x.category === 'vidrio').length },
  { id: 'ch3', title: 'Variedad verde', desc: 'Recicla 4 categorías distintas', goal: 4, reward: 50, metric: (h) => new Set(h.map((x) => x.category)).size },
  { id: 'ch4', title: 'Constancia', desc: 'Recicla 15 residuos', goal: 15, reward: 100, metric: (h) => h.length },
];

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState({ points: 0, history: [], claimed: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setState(JSON.parse(raw)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((next) => {
    setState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const recycle = useCallback(
    (item) => {
      const entry = { id: item.id, name: item.name, category: item.category, at: Date.now() };
      persist({
        ...state,
        points: state.points + POINTS_PER_RECYCLE,
        history: [entry, ...state.history].slice(0, 200),
      });
      return POINTS_PER_RECYCLE;
    },
    [state, persist]
  );

  const claim = useCallback(
    (challenge) => {
      if (state.claimed.includes(challenge.id)) return;
      persist({
        ...state,
        points: state.points + challenge.reward,
        claimed: [...state.claimed, challenge.id],
      });
    },
    [state, persist]
  );

  const reset = useCallback(() => persist({ points: 0, history: [], claimed: [] }), [persist]);

  return (
    <Ctx.Provider value={{ ...state, loaded, recycle, claim, reset }}>{children}</Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
