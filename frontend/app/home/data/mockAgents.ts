export const mockAgents = [
  {
    id: "1",
    tournamentId: 5,
    tournament_id: 5,

    name: "QuantPanda",
    type: "MomentumTrader",
    personality: "aggressive",
    risk_score: 0.82,
    total_value: 10523.40,
    cash: 234.80,
    holdings_value: 10288.60,
    roi_percent: 12.4,
    num_trades: 152,
    win_rate: 0.61,

    // Betting fields
    odds: 2.4,
    oddsDecimal: 2.4,
    oddsFractional: "7/5",
    minBetEth: "0.001",

    rank: 1,
    volatility: 0.75,
    quote: "Staying nimble in fast markets!",
  },

  {
    id: "2",
    tournamentId: 5,
    tournament_id: 5,

    name: "MeanReverter",
    type: "StatArb",
    personality: "neutral",
    risk_score: 0.45,
    total_value: 9880.10,
    cash: 500.00,
    holdings_value: 9380.10,
    roi_percent: -1.2,
    num_trades: 98,
    win_rate: 0.49,

    odds: 1.8,
    oddsDecimal: 1.8,
    oddsFractional: "4/5",
    minBetEth: "0.001",

    rank: 2,
    volatility: 0.32,
    quote: "Everything returns to the mean.",
  },

  {
    id: "3",
    tournamentId: 5,
    tournament_id: 5,

    name: "DeepHODL",
    type: "NeuralNetTrader",
    personality: "patient",
    risk_score: 0.32,
    total_value: 11256.75,
    cash: 1056.10,
    holdings_value: 10200.65,
    roi_percent: 18.9,
    num_trades: 65,
    win_rate: 0.72,

    odds: 3.1,
    oddsDecimal: 3.1,
    oddsFractional: "21/10",
    minBetEth: "0.001",

    rank: 3,
    volatility: 0.18,
    quote: "Learning as I go.",
  },

  {
    id: "4",
    tournamentId: 5,
    tournament_id: 5,

    name: "FlashBear",
    type: "HighFreqTrader",
    personality: "volatile",
    risk_score: 0.91,
    total_value: 9204.33,
    cash: 420.00,
    holdings_value: 8784.33,
    roi_percent: -5.7,
    num_trades: 302,
    win_rate: 0.44,

    odds: 4.0,
    oddsDecimal: 4.0,
    oddsFractional: "3/1",
    minBetEth: "0.001",

    rank: 4,
    volatility: 0.95,
    quote: "Fast trades, fast gains—or losses.",
  },

  {
    id: "5",
    tournamentId: 5,
    tournament_id: 5,

    name: "EcoInvestor",
    type: "MacroFund",
    personality: "conservative",
    risk_score: 0.21,
    total_value: 10012.90,
    cash: 2500.00,
    holdings_value: 7512.90,
    roi_percent: 3.8,
    num_trades: 40,
    win_rate: 0.57,

    odds: 2.0,
    oddsDecimal: 2.0,
    oddsFractional: "1/1",
    minBetEth: "0.001",

    rank: 5,
    volatility: 0.12,
    quote: "Slow and steady wins.",
  },

  // --- T O U R N A M E N T   # 4   (ENDED) ---

  {
    id: "10",
    tournamentId: 4,
    tournament_id: 4,
    name: "AlphaWolf",
    type: "Momentum",
    personality: "aggressive",
    risk_score: 0.74,
    total_value: 12540.44,
    cash: 300.12,
    holdings_value: 12240.32,
    roi_percent: 15.1,
    num_trades: 220,
    win_rate: 0.68,

    odds: 1.6,
    oddsDecimal: 1.6,
    oddsFractional: "3/5",
    minBetEth: "0.001",

    rank: 1,   // WINNER
    volatility: 0.65,
    quote: "Strike fast, strike smart.",
  },

  {
    id: "11",
    tournamentId: 4,
    tournament_id: 4,
    name: "MeanBear",
    type: "Reversion",
    personality: "neutral",
    risk_score: 0.40,
    total_value: 11980.33,
    cash: 512.12,
    holdings_value: 11468.21,
    roi_percent: 10.8,
    num_trades: 140,
    win_rate: 0.55,

    odds: 2.2,
    oddsDecimal: 2.2,
    oddsFractional: "6/5",
    minBetEth: "0.001",

    rank: 2,
    volatility: 0.28,
    quote: "Everything swings back eventually.",
  },

  {
    id: "12",
    tournamentId: 4,
    tournament_id: 4,
    name: "NeuroBull",
    type: "NeuralTrader",
    personality: "patient",
    risk_score: 0.35,
    total_value: 10800.00,
    cash: 760,
    holdings_value: 10040,
    roi_percent: 4.8,
    num_trades: 100,
    win_rate: 0.51,

    odds: 3.0,
    oddsDecimal: 3.0,
    oddsFractional: "2/1",
    minBetEth: "0.001",

    rank: 3,
    volatility: 0.22,
    quote: "Learning every tick.",
  },

  {
    id: "13",
    tournamentId: 4,
    tournament_id: 4,
    name: "HedgeHawk",
    type: "Macro",
    personality: "conservative",
    risk_score: 0.22,
    total_value: 9440.59,
    cash: 2400.22,
    holdings_value: 7040.37,
    roi_percent: -2.3,
    num_trades: 42,
    win_rate: 0.47,

    odds: 4.8,
    oddsDecimal: 4.8,
    oddsFractional: "19/5",
    minBetEth: "0.001",

    rank: 4,
    volatility: 0.18,
    quote: "Slow is smooth. Smooth is fast.",
  }
];

