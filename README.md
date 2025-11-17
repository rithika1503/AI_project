# Route Craft - A* Pathfinding Visualizer

Interactive maze solver using the A* algorithm. Create custom mazes and watch the AI find the shortest path in real-time!

## Features

- Interactive grid-based maze builder
- Real-time A* pathfinding visualization
- Gamified UI with scoring system
- Adjustable animation speed
- Random maze generation

## Quick Start

### Backend Setup

- cd backend

- python -m venv venv

- source venv/bin/activate  

- pip install requirements.txt

- python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 


Backend will run at "http://localhost:8000"

### Frontend Setup

The frontend is a React app . It automatically connects to the backend at "http://localhost:8000"


## How to Use

1. **Draw Walls**: Select "Wall" tool and click/drag on the grid
2. **Set Points**: Use "Start" and "End" tools to place markers
3. **Run A***: Click "RUN A*" to find the shortest path
4. **Random**: Generate a random maze
5. **Reset**: Clear the grid

### Color Guide

- 🟩 Green = Start
- 🟥 Red = End
- ⬛ Black = Walls
- 🟨 Yellow = Explored nodes
- 🟦 Blue = Shortest path

## Project Structure


backend/
├─- main.py          
├-- astar.py         
└-- requirements.txt 
frontend/
|--src/
     |--app.css
     |--app.jsx
     |--astar.jsx
     |--index.css
     |--main.jsx
     
|--index.html
|--package-lock.json
|--package.json
|--vite-config.js

## Requirements

- Python 3.10+
- FastAPI, Uvicorn, Pydantic
- Modern web browser


## API Endpoint

**POST /solve**
json
{
  "grid": [[0,0,1], [0,1,0]],
  "start": [0,0],
  "end": [2,1]
}


Returns path, path length, and nodes explored.

