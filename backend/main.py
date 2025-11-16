from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple, Optional
from astar import AStar

app = FastAPI(title="A* Pathfinding API")

# CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PathRequest(BaseModel):
    grid: List[List[int]]
    start: Tuple[int, int]
    end: Tuple[int, int]

class PathResponse(BaseModel):
    path: Optional[List[Tuple[int, int]]]
    path_length: int
    nodes_explored: int
    visited: List[Tuple[int, int]]
    success: bool

@app.get("/")
async def root():
    return {
        "message": "A* Pathfinding API",
        "endpoints": {
            "/solve": "POST - Solve pathfinding problem",
            "/docs": "API documentation"
        }
    }

@app.post("/solve", response_model=PathResponse)
async def solve_pathfinding(request: PathRequest):
    """
    Solve the pathfinding problem using A* algorithm
    
    - **grid**: 2D array where 0 = empty, 1 = obstacle
    - **start**: Starting coordinates [x, y]
    - **end**: Ending coordinates [x, y]
    """
    try:
        astar = AStar(request.grid)
        path, visited = astar.find_path(request.start, request.end)
        
        if path:
            return PathResponse(
                path=path,
                path_length=len(path),
                nodes_explored=len(visited),
                visited=visited,
                success=True
            )
        else:
            return PathResponse(
                path=None,
                path_length=0,
                nodes_explored=len(visited),
                visited=visited,
                success=False
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}