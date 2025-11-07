from fastapi import Request
class TestDataStore:
    def __init__(self) -> None:
        # stores a dict for each type, each dict acting as a table for mock data (dict of dicts)
        self.tournaments = {}
        self.agents = {}
        self.bets = {}
        self.trades = {}
        # stores the counts of the items in each table
        self.counts = {"tournaments" : 0,
                       "agents" : 0,
                       "bets" : 0,
                       "trades" : 0}

    def next_id(self, table_name: str) -> int:
        '''Iterates to next id, imiates the DB's feature of automatically id updating'''
        self.counts[table_name] += 1
        return self.counts[table_name]
    
    def reset(self) -> None:
        '''Resets this "data store"'''
        self.__init__()

def get_store(request: Request) -> "TestDataStore":
    '''Returns the store for the request, if none then creates a new, empty store'''
    if not hasattr(request.app.state, "store"):
        request.app.state.store = TestDataStore()
    return request.app.state.store


