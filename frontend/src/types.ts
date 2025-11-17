//defines all TypeScript "shapes" (interfaces/types) used in the app

export type ID = string;
export type ISODate = string;

export interface Agent {
    id: ID; 
    name: string;
    personality?: string;
    wallet_address?: number;
    total_trades?: number;
    total_winnings?: number;
}

export interface Tournament {
    id: ID;
    name: string;
    start_date: ISODate;
    end_date: ISODate;
    prize_pool: number;
    status: 'upcoming' | 'ongoing' | 'completed';
}

export interface Trade {
    id: ID;
    agent_id: ID;
    tournament_id: ID;
    action: 'buy' | 'sell';
    token: string;
    amountTotal: number;
    priceUSD: number;
    priceMoney: number;
    created_at: ISODate;
}

export interface Bet {
    id: ID;
    user_address: string;
    tournament_id: ID;
    agent_id: ID;
    amount_eth: number;
    placed_at: ISODate;
    outcome?: 'win' | 'lose' | 'pending';
}

export interface ApiError {
    message: string;
    detail?: string;
    status?: number;
}

export interface CreateAgentData {
    name: string;
    // Add any other required or optional fields from Agent interface that can be created
    personality?: string;
    wallet_address?: number;
}

export interface UpdateAgentData extends Partial<CreateAgentData> {
    // Add fields that can only be updated, like performance stats
    total_trades?: number;
    total_winnings?: number;
}

export interface CreateTournamentData {
    name: string;
    start_date: ISODate;
    end_date: ISODate;
    prize_pool: number;
    //  optional fields
    description?: string;
    entry_fee?: number;
    max_participants?: number;
    rules?: Record<string, any>;
}

export interface UpdateTournamentData extends Partial<CreateTournamentData> {
    status?: 'upcoming' | 'ongoing' | 'completed';
    current_participants?: number;
}

export interface CreateBetData {
    tournament_id: ID;
    agent_id: ID;
    amount_eth: number;
    //  optional fields
    predicted_rank?: number;
}

export interface UpdateBetData {
    status?: 'pending' | 'won' | 'lost' | 'cancelled';
    outcome?: 'win' | 'lose' | 'pending';
    payout?: number;
}

export interface CreateTradeData {
    agent_id: ID;
    tournament_id: ID;
    token: string;
    action: 'buy' | 'sell';
    amountTotal: number;
    priceUSD: number;
}

export interface UserBetsSummary {
    total_bets: number;
    active_bets: number;
    total_wagered: number;
    total_winnings: number;
    win_rate: number;
    bets: Bet[];
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}