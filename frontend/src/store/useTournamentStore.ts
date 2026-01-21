import { create } from 'zustand';
import type { AgentBet } from '@/src/types/AgentBet';

type TxStatus = 'idle' | 'confirming' | 'pending' | 'success' | 'error';

// Minimal agent info required to open bet modal (for simple BetButton usage)
type MinimalAgent = { id: string; name: string };

interface TournamentStore {
  // Tournament selection
  selectedTournamentId: string;
  setTournamentId: (id: string) => void;

  // Betting Modal state
  isBetModalOpen: boolean;
  selectedAgent: AgentBet | null;
  openBetModal: (agent: MinimalAgent | AgentBet) => void;
  closeBetModal: () => void;

  // Web3 transaction status (for BetModal)
  txStatus: TxStatus;
  txHash: string | null;
  txError: string | null;

  setTxStatus: (s: TxStatus) => void;
  setTxHash: (hash: string | null) => void;
  setTxError: (msg: string | null) => void;
  resetTxState: () => void;
}

export const useTournamentStore = create<TournamentStore>((set) => ({
  // Tournament state
  selectedTournamentId: '5', // Default tournament ID as string

  setTournamentId: (id) => set({ selectedTournamentId: id }),

  // Betting modal state
  isBetModalOpen: false,
  selectedAgent: null,

  openBetModal: (agent) =>
    set({
      // Convert minimal agent to AgentBet with defaults if needed
      selectedAgent: 'tournamentId' in agent
        ? agent
        : {
            ...agent,
            tournamentId: '',
            personality: '',
            odds: 0,
            winRate: 0,
            portfolioValue: 0,
            pnl: 0,
            volatility: 0,
          },
      isBetModalOpen: true,
      txStatus: 'idle',   // reset tx state when modal opens
      txHash: null,
      txError: null,
    }),

  closeBetModal: () =>
    set({
      selectedAgent: null,
      isBetModalOpen: false,
      txStatus: 'idle',
      txHash: null,
      txError: null,
    }),

  // Web3 tx state
  txStatus: 'idle',
  txHash: null,
  txError: null,

  setTxStatus: (txStatus) => set({ txStatus }),
  setTxHash: (txHash) => set({ txHash }),
  setTxError: (txError) => set({ txError }),

  resetTxState: () =>
    set({
      txStatus: 'idle',
      txHash: null,
      txError: null,
    }),
}));
