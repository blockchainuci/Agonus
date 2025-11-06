from fastapi import APIRouter

router = APIRouter(prefix = "/tournaments", tags=["tournaments"])


@router.get("/")
def list_tournaments():

@router.get("/{id}")
def get_tournament(id):
    

@router.post("/")
def create_tournament():
    
@router.put("/{id}")
def update_tournament(status, prizepool, etc):

@router.delete("/{id}")
def delete_tournament(id):
    
