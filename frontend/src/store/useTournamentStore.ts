import { create } from 'zustand';
import type { AgentBet } from '@/lib/types/AgentBet';

interface TournamentStore {
  // Tournament selection (GLOBAL)
  selectedTournamentId: number;
  setTournamentId: (id: number) => void;

  // Bet modal (GLOBAL UI state)
  isBetModalOpen: boolean;
  selectedAgent: AgentBet | null;
  openBetModal: (agent: AgentBet) => void;
  closeBetModal: () => void;
}

export const useTournamentStore = create<TournamentStore>((set) => ({
  // Default tournament
  selectedTournamentId: 5,

  setTournamentId: (id) => set({ selectedTournamentId: id }),

  // --- Bet modal state ---
  isBetModalOpen: false,
  selectedAgent: null,

  openBetModal: (agent) =>
    set({ selectedAgent: agent, isBetModalOpen: true }),

  closeBetModal: () =>
    set({ selectedAgent: null, isBetModalOpen: false }),
}));
