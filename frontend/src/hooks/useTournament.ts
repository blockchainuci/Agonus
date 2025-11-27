export function useTournament(tournamentId: number) {
   return {
      tournament: null,
      pools: [],
      odds: [],
      loading: true,
   };
}
