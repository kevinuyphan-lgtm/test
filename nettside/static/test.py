import time
import os

def print_grid(grid):
    os.system("cls" if os.name == "nt" else "clear")
    for row in grid:
        print(" ".join("█" if cell else "." for cell in row))
    print()

def count_neighbors(grid, x, y):
    neighbors = 0
    for i in [-1, 0, 1]:
        for j in [-1, 0, 1]:
            if (i, j) != (0, 0):
                nx, ny = x + i, y + j
                if 0 <= nx < len(grid) and 0 <= ny < len(grid[0]):
                    neighbors += grid[nx][ny]
    return neighbors

def next_generation(grid):
    new_grid = [[0]*len(grid[0]) for _ in range(len(grid))]
    for x in range(len(grid)):
        for y in range(len(grid[0])):
            alive = grid[x][y]
            n = count_neighbors(grid, x, y)

            if alive and (n == 2 or n == 3):
                new_grid[x][y] = 1
            elif not alive and n == 3:
                new_grid[x][y] = 1
    return new_grid

# Startkonfigurasjon
grid = [
    [0,1,0,1,0,1,0],
    [0,1,0,0,0,0,1],
    [0,1,0,1,1,1,1]
]

while True:
    print_grid(grid)
    grid = next_generation(grid)
    time.sleep(0.5)
