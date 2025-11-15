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
    strategy_type?: string;
    description?: string;
    risk_level?: 'low' | 'medium' | 'high';
    initial_capital?: number;
    current_value?: number;
    winning_trades?: number;
    created_at?: ISODate;
    updated_at?: ISODate;
    performance_metrics?: {
        total_return: number;
        win_rate: number;
        sharpe_ratio?: number;
        max_drawdown?: number;
    };
}

export interface Tournament {
    id: ID;
    name: string;
    start_date: ISODate;
    end_date: ISODate;
    prize_pool: number;
    status: 'upcoming' | 'ongoing' | 'completed';
    description?: string;
    entry_fee?: number;
    max_participants?: number;
    current_participants?: number;
    rules?: Record<string, any>;
    created_at?: ISODate;
    updated_at?: ISODate;
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
    asset_symbol?: string; 
    trade_type?: 'buy' | 'sell'; 
    quantity?: number; 
    price?: number; 
    timestamp?: ISODate; 
    execution_status?: 'pending' | 'executed' | 'failed' | 'cancelled';
    profit_loss?: number;
    notes?: string;
}

export interface Bet {
    id: ID;
    user_address: string;
    tournament_id: ID;
    agent_id: ID;
    amount_eth: number;
    placed_at: ISODate;
    outcome?: 'win' | 'lose' | 'pending';
    user_id?: ID;
    bet_amount?: number; 
    predicted_rank?: number;
    odds?: number;
    status?: 'pending' | 'won' | 'lost' | 'cancelled'; 
    payout?: number;
    created_at?: ISODate; 
    updated_at?: ISODate;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface User {
    id: ID;
    address: string;
    username?: string;
    created_at: ISODate;
    is_admin?: boolean;
}

export interface CreateAgentData {
    name: string;
    strategy_type?: string;
    description?: string;
    risk_level?: 'low' | 'medium' | 'high';
    initial_capital?: number;
    personality?: string;
    wallet_address?: number;
}

export interface UpdateAgentData extends Partial<CreateAgentData> {
    current_value?: number;
    total_trades?: number;
    total_winnings?: number;
}

export interface CreateTournamentData {
    name: string;
    description?: string;
    start_date: ISODate;
    end_date: ISODate;
    entry_fee?: number;
    prize_pool: number;
    max_participants?: number;
    rules?: Record<string, any>;
}

export interface UpdateTournamentData extends Partial<CreateTournamentData> {
    status?: 'upcoming' | 'ongoing' | 'completed';
    current_participants?: number;
}

export interface CreateTradeData {
    agent_id: ID;
    tournament_id?: ID;
    token: string; 
    action: 'buy' | 'sell';
    amountTotal: number; 
    priceUSD: number; 
    priceMoney?: number;
    notes?: string;
}

export interface CreateBetData {
    tournament_id: ID;
    agent_id: ID;
    amount_eth: number; 
    predicted_rank?: number;
}

export interface UpdateBetData {
    status?: 'pending' | 'won' | 'lost' | 'cancelled';
    outcome?: 'win' | 'lose' | 'pending';
    payout?: number;
}


export interface TournamentEntry {
    id: ID;
    tournament_id: ID;
    user_id: ID;
    agent_id: ID;
    entry_date: ISODate;
    current_rank?: number;
    current_score?: number;
}


export interface TradeHistory {
    trades: Trade[];
    total_trades: number;
    total_profit_loss: number;
    win_rate: number;
}

export interface UserBetsSummary {
    total_bets: number;
    active_bets: number;
    total_wagered: number;
    total_winnings: number;
    win_rate: number;
    bets: Bet[];
}

export interface LeaderboardEntry {
    rank: number;
    agent_id: ID;
    agent_name: string;
    user_id: ID;
    username?: string;
    score: number;
    total_return: number;
    win_rate: number;
    total_trades: number;
}

export interface Leaderboard {
    tournament_id?: ID;
    entries: LeaderboardEntry[];
    updated_at: ISODate;
}

export interface PortfolioPosition {
    asset_symbol: string;
    quantity: number;
    average_price: number;
    current_price: number;
    current_value: number;
    unrealized_pnl: number;
    unrealized_pnl_percent: number;
}

export interface Portfolio {
    agent_id: ID;
    total_value: number;
    cash_balance: number;
    positions: PortfolioPosition[];
    total_unrealized_pnl: number;
    updated_at: ISODate;
}



export interface ApiError {
    message: string;
    detail?: string;
    status?: number;
}


export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface PaginationParams {
    page?: number;
    size?: number;
}


export interface TradeFilters extends PaginationParams {
    tournament_id?: ID;
    agent_id?: ID;
    trade_type?: 'buy' | 'sell';
    action?: 'buy' | 'sell'; 
    start_date?: ISODate;
    end_date?: ISODate;
}

export interface TournamentFilters extends PaginationParams {
    status?: 'upcoming' | 'ongoing' | 'completed';
}

export interface BetFilters extends PaginationParams {
    status?: 'pending' | 'won' | 'lost' | 'cancelled';
    tournament_id?: ID;
}


export type BackendTrade = Trade;
export type FrontendTrade = Trade;

export type TournamentStatus = Tournament['status'];
export type BetOutcome = Bet['outcome'];
export type BetStatus = NonNullable<Bet['status']>;
export type TradeExecutionStatus = NonNullable<Trade['execution_status']>;
export type RiskLevel = NonNullable<Agent['risk_level']>;