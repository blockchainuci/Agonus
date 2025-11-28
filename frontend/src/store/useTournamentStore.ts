import { create } from 'zustand';
import type { AgentBet } from '@/lib/types/AgentBet';

interface TournamentStore {
  selectedTournamentId: number;
  setTournamentId: (id: number) => void;

  isBetModalOpen: boolean;
  selectedAgent: AgentBet | null;
  openBetModal: (agent: AgentBet) => void;
  closeBetModal: () => void;
}

export const useTournamentStore = create<TournamentStore>((set) => ({
  selectedTournamentId: 5,

  setTournamentId: (id) => set({ selectedTournamentId: Number(id) }),

  isBetModalOpen: false,
  selectedAgent: null,

  openBetModal: (agent) =>
    set({ selectedAgent: agent, isBetModalOpen: true }),

  closeBetModal: () =>
    set({ selectedAgent: null, isBetModalOpen: false }),
}));
