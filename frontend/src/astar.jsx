import React, { useState, useCallback } from 'react';
import { Play, RotateCcw, Trash2 } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 30;

const CELL_TYPES = {
  EMPTY: 0,
  WALL: 1,
  START: 2,
  END: 3,
  PATH: 4,
  VISITED: 5
};

const API_URL = 'http://localhost:8000';

const AStarVisualizer = () => {
  const [grid, setGrid] = useState(() => 
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(CELL_TYPES.EMPTY))
  );
  const [start, setStart] = useState({ x: 2, y: 2 });
  const [end, setEnd] = useState({ x: 17, y: 17 });
  const [selectedTool, setSelectedTool] = useState(CELL_TYPES.WALL);
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState([]);
  const [visited, setVisited] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState(null);

  // Initialize grid with start and end
  React.useEffect(() => {
    const newGrid = grid.map(row => [...row]);
    newGrid[start.y][start.x] = CELL_TYPES.START;
    newGrid[end.y][end.x] = CELL_TYPES.END;
    setGrid(newGrid);
  }, []);

  const getCellColor = (cellType) => {
    switch(cellType) {
      case CELL_TYPES.EMPTY: return 'bg-gray-100';
      case CELL_TYPES.WALL: return 'bg-gray-800';
      case CELL_TYPES.START: return 'bg-green-500';
      case CELL_TYPES.END: return 'bg-red-500';
      case CELL_TYPES.PATH: return 'bg-blue-400';
      case CELL_TYPES.VISITED: return 'bg-yellow-200';
      default: return 'bg-gray-100';
    }
  };

  const handleCellClick = (x, y) => {
    if (isRunning) return;
    
    const newGrid = grid.map(row => [...row]);
    
    if (selectedTool === CELL_TYPES.START) {
      newGrid[start.y][start.x] = CELL_TYPES.EMPTY;
      newGrid[y][x] = CELL_TYPES.START;
      setStart({ x, y });
    } else if (selectedTool === CELL_TYPES.END) {
      newGrid[end.y][end.x] = CELL_TYPES.EMPTY;
      newGrid[y][x] = CELL_TYPES.END;
      setEnd({ x, y });
    } else if (newGrid[y][x] === CELL_TYPES.EMPTY || newGrid[y][x] === CELL_TYPES.WALL) {
      newGrid[y][x] = selectedTool === CELL_TYPES.WALL ? CELL_TYPES.WALL : CELL_TYPES.EMPTY;
    }
    
    setGrid(newGrid);
    setPath([]);
    setVisited([]);
  };

  const handleMouseDown = (x, y) => {
    setIsDrawing(true);
    handleCellClick(x, y);
  };

  const handleMouseEnter = (x, y) => {
    if (isDrawing && (selectedTool === CELL_TYPES.WALL || selectedTool === CELL_TYPES.EMPTY)) {
      handleCellClick(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const runAStar = async () => {
    setIsRunning(true);
    setPath([]);
    setVisited([]);

    try {
      const response = await fetch(`${API_URL}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grid: grid.map(row => row.map(cell => 
            cell === CELL_TYPES.WALL ? 1 : 0
          )),
          start: [start.x, start.y],
          end: [end.x, end.y]
        })
      });

      const data = await response.json();
      
      if (data.path) {
        // Animate visited cells first
        for (let i = 0; i < data.visited.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 10));
          setVisited(data.visited.slice(0, i + 1));
        }
        
        // Then animate path
        for (let i = 0; i < data.path.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          setPath(data.path.slice(0, i + 1));
        }
        
        setStats({
          pathLength: data.path_length,
          nodesExplored: data.nodes_explored
        });
      } else {
        alert('No path found!');
      }
    } catch (error) {
      alert('Error: Make sure the backend server is running on http://localhost:8000');
      console.error(error);
    }

    setIsRunning(false);
  };

  const resetGrid = () => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(CELL_TYPES.EMPTY));
    newGrid[start.y][start.x] = CELL_TYPES.START;
    newGrid[end.y][end.x] = CELL_TYPES.END;
    setGrid(newGrid);
    setPath([]);
    setVisited([]);
    setStats(null);
  };

  const clearPath = () => {
    setPath([]);
    setVisited([]);
    setStats(null);
  };

  // Render grid with path and visited nodes
  const renderGrid = grid.map((row, y) => 
    row.map((cell, x) => {
      let cellType = cell;
      
      // Override with visited or path if applicable
      const isVisited = visited.some(([vx, vy]) => vx === x && vy === y);
      const isPath = path.some(([px, py]) => px === x && py === y);
      
      if (isPath && cell !== CELL_TYPES.START && cell !== CELL_TYPES.END) {
        cellType = CELL_TYPES.PATH;
      } else if (isVisited && cell !== CELL_TYPES.START && cell !== CELL_TYPES.END && !isPath) {
        cellType = CELL_TYPES.VISITED;
      }
      
      return { x, y, type: cellType };
    })
  );

  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">A* Pathfinding Visualizer</h1>
      
      <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTool(CELL_TYPES.WALL)}
              className={`px-4 py-2 rounded ${selectedTool === CELL_TYPES.WALL ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
            >
              Wall
            </button>
            <button
              onClick={() => setSelectedTool(CELL_TYPES.EMPTY)}
              className={`px-4 py-2 rounded ${selectedTool === CELL_TYPES.EMPTY ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Eraser
            </button>
            <button
              onClick={() => setSelectedTool(CELL_TYPES.START)}
              className={`px-4 py-2 rounded ${selectedTool === CELL_TYPES.START ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              Set Start
            </button>
            <button
              onClick={() => setSelectedTool(CELL_TYPES.END)}
              className={`px-4 py-2 rounded ${selectedTool === CELL_TYPES.END ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            >
              Set End
            </button>
          </div>
          
          <div className="flex gap-2 ml-auto">
            <button
              onClick={runAStar}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              <Play size={20} /> Run A*
            </button>
            <button
              onClick={clearPath}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              <Trash2 size={20} /> Clear Path
            </button>
            <button
              onClick={resetGrid}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <RotateCcw size={20} /> Reset
            </button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex gap-8 text-sm">
            <div><span className="font-semibold">Path Length:</span> {stats.pathLength}</div>
            <div><span className="font-semibold">Nodes Explored:</span> {stats.nodesExplored}</div>
          </div>
        </div>
      )}

      <div 
        className="bg-white rounded-lg shadow-2xl p-4"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          }}
        >
          {renderGrid.flat().map(({ x, y, type }) => (
            <div
              key={`${x}-${y}`}
              className={`${getCellColor(type)} border border-gray-300 cursor-pointer transition-colors duration-100`}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
              onMouseDown={() => handleMouseDown(x, y)}
              onMouseEnter={() => handleMouseEnter(x, y)}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-lg p-4 max-w-2xl">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>🟩 <strong>Green:</strong> Start point | 🟥 <strong>Red:</strong> End point</li>
          <li>⬛ <strong>Black:</strong> Walls/Obstacles | 🟨 <strong>Yellow:</strong> Explored nodes</li>
          <li>🟦 <strong>Blue:</strong> Shortest path found</li>
          <li>Click and drag to draw walls. Use tools to set start/end points.</li>
          <li>Click "Run A*" to find the shortest path!</li>
        </ul>
      </div>
    </div>
  );
};

export default AStarVisualizer;
