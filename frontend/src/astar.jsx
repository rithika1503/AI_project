import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Trash2, Zap, Trophy, Target, MapPin, Sparkles } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 32;

const CELL_TYPES = {
  EMPTY: 0,
  WALL: 1,
  START: 2,
  END: 3,
  PATH: 4,
  VISITED: 5
};

const API_URL = 'http://localhost:8000';

const AStarGame = () => {
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
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [animationSpeed, setAnimationSpeed] = useState(10);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const newGrid = grid.map(row => [...row]);
    newGrid[start.y][start.x] = CELL_TYPES.START;
    newGrid[end.y][end.x] = CELL_TYPES.END;
    setGrid(newGrid);
  }, []);

  const getCellStyle = (cellType, x, y) => {
    const isInPath = path.some(([px, py]) => px === x && py === y);
    const isVisited = visited.some(([vx, vy]) => vx === x && vy === y);
    
    let baseClass = 'relative transition-all duration-300 border border-gray-700/20 cursor-pointer hover:scale-105 ';
    let innerContent = null;

    if (cellType === CELL_TYPES.START || (isInPath && x === start.x && y === start.y)) {
      baseClass += 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50';
      innerContent = <MapPin className="absolute inset-0 m-auto text-white" size={20} />;
    } else if (cellType === CELL_TYPES.END || (isInPath && x === end.x && y === end.y)) {
      baseClass += 'bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/50 animate-pulse';
      innerContent = <Target className="absolute inset-0 m-auto text-white" size={20} />;
    } else if (isInPath && cellType !== CELL_TYPES.WALL) {
      baseClass += 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/50 animate-pulse';
      innerContent = <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
      </div>;
    } else if (isVisited && cellType !== CELL_TYPES.WALL) {
      baseClass += 'bg-gradient-to-br from-yellow-300 to-yellow-400';
    } else if (cellType === CELL_TYPES.WALL) {
      baseClass += 'bg-gradient-to-br from-gray-700 to-gray-900 shadow-inner';
      innerContent = <div className="absolute inset-0 bg-gray-800/50"></div>;
    } else {
      baseClass += 'bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800';
    }

    return { className: baseClass, content: innerContent };
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
    setShowSuccess(false);

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
        // Animate visited cells
        for (let i = 0; i < data.visited.length; i++) {
          await new Promise(resolve => setTimeout(resolve, animationSpeed));
          setVisited(data.visited.slice(0, i + 1));
        }
        
        // Animate path
        for (let i = 0; i < data.path.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          setPath(data.path.slice(0, i + 1));
        }
        
        setStats({
          pathLength: data.path_length,
          nodesExplored: data.nodes_explored
        });

        // Calculate score
        const efficiency = Math.max(0, 100 - data.nodes_explored);
        const pathScore = Math.max(0, 200 - data.path_length * 2);
        const totalScore = efficiency + pathScore;
        setScore(prev => prev + totalScore);
        setShowSuccess(true);
        
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert('🚫 No path found! Try removing some obstacles.');
      }
    } catch (error) {
      alert('⚠️ Error: Make sure the backend server is running on http://localhost:8000');
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

  const generateRandomMaze = () => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(CELL_TYPES.EMPTY));
    
    // Add random walls
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (Math.random() < 0.25 && !(x === start.x && y === start.y) && !(x === end.x && y === end.y)) {
          newGrid[y][x] = CELL_TYPES.WALL;
        }
      }
    }
    
    newGrid[start.y][start.x] = CELL_TYPES.START;
    newGrid[end.y][end.x] = CELL_TYPES.END;
    setGrid(newGrid);
    setPath([]);
    setVisited([]);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex flex-col items-center overflow-auto">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Success Animation */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-12 py-8 rounded-2xl shadow-2xl animate-bounce text-3xl font-bold flex items-center gap-4">
            <Trophy size={48} className="text-yellow-300" />
            PATH FOUND! 🎉
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 text-center mb-6">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2 tracking-tight drop-shadow-lg">
          Route Craft
        </h1>
        <p className="text-cyan-300 text-lg font-semibold flex items-center justify-center gap-2">
          <Sparkles size={20} /> AI Maze Solver Challenge <Sparkles size={20} />
        </p>
      </div>

      {/* Stats Bar */}
      <div className="relative z-10 bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-6 border border-cyan-500/30">
        <div className="flex gap-8 items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-xl shadow-lg">
              <Trophy className="text-white" size={24} />
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Score</div>
              <div className="text-3xl font-bold text-yellow-400">{score}</div>
            </div>
          </div>
          
          <div className="h-12 w-px bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-3 rounded-xl shadow-lg">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Level</div>
              <div className="text-3xl font-bold text-purple-400">{level}</div>
            </div>
          </div>

          {stats && (
            <>
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
              
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl shadow-lg">
                  <Target className="text-white" size={24} />
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Path Length</div>
                  <div className="text-3xl font-bold text-green-400">{stats.pathLength}</div>
                </div>
              </div>

              <div className="h-12 w-px bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
              
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-3 rounded-xl shadow-lg">
                  <Sparkles className="text-white" size={24} />
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Nodes Explored</div>
                  <div className="text-3xl font-bold text-blue-400">{stats.nodesExplored}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="relative z-10 bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-6 border border-cyan-500/30">
        <div className="flex gap-4 items-center flex-wrap justify-center">
          {/* Tool Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTool(CELL_TYPES.WALL)}
              className={`px-5 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                selectedTool === CELL_TYPES.WALL 
                  ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg shadow-gray-700/50 scale-105' 
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
              }`}
            >
              🧱 Wall
            </button>
            <button
              onClick={() => setSelectedTool(CELL_TYPES.EMPTY)}
              className={`px-5 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                selectedTool === CELL_TYPES.EMPTY 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50 scale-105' 
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
              }`}
            >
              ✏️ Eraser
            </button>
            <button
              onClick={() => setSelectedTool(CELL_TYPES.START)}
              className={`px-5 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                selectedTool === CELL_TYPES.START 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50 scale-105' 
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
              }`}
            >
              🎯 Start
            </button>
            <button
              onClick={() => setSelectedTool(CELL_TYPES.END)}
              className={`px-5 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                selectedTool === CELL_TYPES.END 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/50 scale-105' 
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
              }`}
            >
              🏁 End
            </button>
          </div>

          <div className="h-12 w-px bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={runAStar}
              disabled={isRunning}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/50 hover:shadow-green-500/80 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Play size={20} /> {isRunning ? 'SOLVING...' : 'RUN A*'}
            </button>
            <button
              onClick={generateRandomMaze}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/50 hover:shadow-purple-500/80 transform hover:scale-105 transition-all duration-300"
            >
              <Sparkles size={20} /> Random
            </button>
            <button
              onClick={clearPath}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/80 transform hover:scale-105 transition-all duration-300"
            >
              <Trash2 size={20} /> Clear
            </button>
            <button
              onClick={resetGrid}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/50 hover:shadow-red-500/80 transform hover:scale-105 transition-all duration-300"
            >
              <RotateCcw size={20} /> Reset
            </button>
          </div>
        </div>

        {/* Speed Control */}
        
      </div>

      {/* Game Grid */}
      <div 
        className="relative z-10 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border-4 border-cyan-500/30"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="grid gap-0 rounded-xl overflow-hidden shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          }}
        >
          {grid.map((row, y) => 
            row.map((cell, x) => {
              const { className, content } = getCellStyle(cell, x, y);
              return (
                <div
                  key={`${x}-${y}`}
                  className={className}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                  onMouseDown={() => handleMouseDown(x, y)}
                  onMouseEnter={() => handleMouseEnter(x, y)}
                >
                  {content}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="relative z-10 mt-6 bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 max-w-4xl border border-cyan-500/30">
        <h3 className="font-bold text-2xl mb-4 text-cyan-400 flex items-center gap-2">
          <Sparkles size={24} /> How to Play
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg"></div>
            <span><strong className="text-green-400">Green:</strong> Start Point</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-lg shadow-lg"></div>
            <span><strong className="text-red-400">Red:</strong> End Point</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-lg"></div>
            <span><strong className="text-gray-400">Black:</strong> Walls/Obstacles</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-lg shadow-lg"></div>
            <span><strong className="text-yellow-400">Yellow:</strong> Explored Nodes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg"></div>
            <span><strong className="text-blue-400">Blue:</strong> Shortest Path</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-lg"></div>
            <span><strong className="text-slate-400">Dark:</strong> Empty Space</span>
          </div>
        </div>
        <div className="mt-4 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
          <p className="text-cyan-300">
            💡 <strong>Tip:</strong> Click and drag to draw walls quickly! Create challenging mazes and watch the AI solve them using the A* algorithm.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AStarGame;
