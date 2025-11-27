export function useUserBets(tournamentId: number) {
   return {
      bets: [],
      totalExposure: 0,
      hasClaimed: false,
      loading: true,
   };
}
