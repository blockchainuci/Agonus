import { create } from "zustand";
import type { Bet } from "@/src/types/bets";
import { getMyBets } from "@/src/lib/api/bets";

type BetDraft = {
  tournament_id: string | number | null;
  agent_id: string | number | null;
  agent_name?: string | null;
  contract_tournament_id?: number | null;
  contract_agent_id?: number | null;
  amount_eth: string;
};

type BettingState = {
  isBetModalOpen: boolean;
  draft: BetDraft;

  openBetModal: (args: {
    tournament_id: string | number;
    agent_id: string | number;
    agent_name?: string;
    contract_tournament_id?: number | null;
    contract_agent_id?: number | null;
    amount_eth?: string;
  }) => void;

  closeBetModal: () => void;
  setDraftAmount: (amount_eth: string) => void;

  myBets: Bet[];
  isLoadingBets: boolean;
  betsError: string | null;
  refreshMyBets: (tournament_id?: string | number) => Promise<void>;
};

export const useBettingStore = create<BettingState>((set) => ({
  isBetModalOpen: false,

  draft: {
    tournament_id: null,
    agent_id: null,
    agent_name: null,
    amount_eth: "0.01",
  },

  openBetModal: ({
    tournament_id,
    agent_id,
    agent_name,
    contract_tournament_id,
    contract_agent_id,
    amount_eth,
  }) =>
    set({
      isBetModalOpen: true,
      draft: {
        tournament_id,
        agent_id,
        agent_name: agent_name ?? null,
        contract_tournament_id: contract_tournament_id ?? null,
        contract_agent_id: contract_agent_id ?? null,
        amount_eth: amount_eth ?? "0.01",
      },
    }),

  closeBetModal: () =>
    set({
      isBetModalOpen: false,
      draft: {
        tournament_id: null,
        agent_id: null,
        agent_name: null,
        contract_tournament_id: null,
        contract_agent_id: null,
        amount_eth: "0.01",
      },
    }),

  setDraftAmount: (amount_eth) =>
    set((s) => ({
      draft: { ...s.draft, amount_eth },
    })),

  myBets: [],
  isLoadingBets: false,
  betsError: null,

  refreshMyBets: async (tournament_id) => {
    set({ isLoadingBets: true, betsError: null });
    try {
      const bets = await getMyBets(
        tournament_id ? { tournament_id } : undefined
      );
      set({ myBets: bets, isLoadingBets: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load bets";
      set({ betsError: message, isLoadingBets: false });
    }
  },
}));
