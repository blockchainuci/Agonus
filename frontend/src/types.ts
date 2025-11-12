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