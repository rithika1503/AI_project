import heapq
from typing import List, Tuple, Optional, Set
import math

class Node:
    """Node class for A* pathfinding"""
    def __init__(self, position: Tuple[int, int], parent: Optional['Node'] = None):
        self.position = position
        self.parent = parent
        self.g = 0  # Distance from start node
        self.h = 0  # Heuristic distance to end node
        self.f = 0  # Total cost (g + h)
    
    def __eq__(self, other):
        return self.position == other.position
    
    def __lt__(self, other):
        return self.f < other.f
    
    def __hash__(self):
        return hash(self.position)

class AStar:
    """A* Pathfinding Algorithm"""
    
    def __init__(self, grid: List[List[int]]):
        """
        Initialize A* with a grid
        
        Args:
            grid: 2D list where 0 = walkable, 1 = obstacle
        """
        self.grid = grid
        self.height = len(grid)
        self.width = len(grid[0]) if grid else 0
    
    def heuristic(self, pos1: Tuple[int, int], pos2: Tuple[int, int]) -> float:
        """
        Calculate heuristic (estimated distance) between two positions
        Using Euclidean distance for better pathfinding
        
        Args:
            pos1: First position (x, y)
            pos2: Second position (x, y)
            
        Returns:
            Euclidean distance between positions
        """
        return math.sqrt((pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2)
    
    def get_neighbors(self, position: Tuple[int, int]) -> List[Tuple[int, int]]:
        """
        Get valid neighboring positions (8-directional movement)
        
        Args:
            position: Current position (x, y)
            
        Returns:
            List of valid neighbor positions
        """
        x, y = position
        neighbors = []
        
        # 8 directions: up, down, left, right, and diagonals
        directions = [
            (0, 1), (1, 0), (0, -1), (-1, 0),  # Cardinal directions
            (1, 1), (-1, -1), (1, -1), (-1, 1)  # Diagonal directions
        ]
        
        for dx, dy in directions:
            new_x, new_y = x + dx, y + dy
            
            # Check if position is within bounds
            if 0 <= new_x < self.width and 0 <= new_y < self.height:
                # Check if position is walkable
                if self.grid[new_y][new_x] == 0:
                    neighbors.append((new_x, new_y))
        
        return neighbors
    
    def find_path(self, start: Tuple[int, int], end: Tuple[int, int]) -> Tuple[Optional[List[Tuple[int, int]]], List[Tuple[int, int]]]:
        """
        Find the shortest path from start to end using A* algorithm
        
        Args:
            start: Starting position (x, y)
            end: Ending position (x, y)
            
        Returns:
            Tuple of (path, visited_nodes)
            - path: List of positions from start to end, or None if no path exists
            - visited_nodes: List of all nodes explored during search
        """
        # Validate start and end positions
        if not (0 <= start[0] < self.width and 0 <= start[1] < self.height):
            raise ValueError(f"Start position {start} is out of bounds")
        if not (0 <= end[0] < self.width and 0 <= end[1] < self.height):
            raise ValueError(f"End position {end} is out of bounds")
        if self.grid[start[1]][start[0]] == 1:
            raise ValueError(f"Start position {start} is blocked")
        if self.grid[end[1]][end[0]] == 1:
            raise ValueError(f"End position {end} is blocked")
        
        # Initialize start and end nodes
        start_node = Node(start)
        end_node = Node(end)
        
        # Initialize open and closed lists
        open_list = []
        closed_set = set()
        visited_order = []  # Track order of visited nodes
        
        heapq.heappush(open_list, (start_node.f, start_node))
        
        while open_list:
            # Get node with lowest f score
            current_f, current_node = heapq.heappop(open_list)
            
            # Add to visited list
            if current_node.position not in visited_order:
                visited_order.append(current_node.position)
            
            # Check if we reached the end
            if current_node.position == end_node.position:
                path = []
                while current_node:
                    path.append(current_node.position)
                    current_node = current_node.parent
                return path[::-1], visited_order  # Return reversed path
            
            closed_set.add(current_node.position)
            
            # Check all neighbors
            for neighbor_pos in self.get_neighbors(current_node.position):
                if neighbor_pos in closed_set:
                    continue
                
                neighbor_node = Node(neighbor_pos, current_node)
                
                # Calculate costs
                # Diagonal movement costs sqrt(2), cardinal movement costs 1
                dx = abs(neighbor_pos[0] - current_node.position[0])
                dy = abs(neighbor_pos[1] - current_node.position[1])
                move_cost = math.sqrt(2) if dx + dy == 2 else 1
                
                neighbor_node.g = current_node.g + move_cost
                neighbor_node.h = self.heuristic(neighbor_pos, end)
                neighbor_node.f = neighbor_node.g + neighbor_node.h
                
                # Check if neighbor is already in open list with lower cost
                skip = False
                for _, open_node in open_list:
                    if neighbor_node == open_node and neighbor_node.g >= open_node.g:
                        skip = True
                        break
                
                if not skip:
                    heapq.heappush(open_list, (neighbor_node.f, neighbor_node))
        
        # No path found
        return None, visited_order