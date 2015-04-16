using UnityEngine;
using System.Collections;

// In C# because JS doesnt support multidimensional arrays very well (!!!not true after Unity 3.2!!!)
// In Standard Assets folder because this folder is compiled before all other folders,
// ... needed to be able to be instanciated in a JS file
public class PCGPuzzle : MonoBehaviour {	
	public int puzzleSize = 2;
	
	public bool puzzleLocked = false;
	public bool permaLocked = true;
	
	[HideInInspector]
	public int[,] puzzleLayout;
	[HideInInspector]
	private int[,] winLayout;
	
	[HideInInspector]
	public int doorID = 0;
	[HideInInspector]
	public int treeDepth = -2;
	[HideInInspector]
	public int treeSibling = -2;
	[HideInInspector]
	public bool roomVisited = false;
	

	void Awake () {
		roomVisited = false;
		
		if (puzzleSize < 2)
			Debug.LogError("PCGPuzzle: Puzzle sizes must be greater than 2");
		else {
			// Randomize puzzle layout in a 1D array first (Knuth Shuffle)
			int[] linearPuzzle = new int[puzzleSize*puzzleSize];
			
			// Inialize array values
			for (int i = 0; i < linearPuzzle.Length; i++)
				linearPuzzle[i] = i;
			
			// Loop through and swap each element to a random position
			for (int i = linearPuzzle.Length-1; i >= 0; i--) {
				int newPos = (int)Mathf.Round(Random.value * i);
				
				// Swap values
				int tempValue = linearPuzzle[i];
				linearPuzzle[i] = linearPuzzle[newPos];
				linearPuzzle[newPos] = tempValue;			
			}
			
			// Put linear puzzle into a square puzzle
			puzzleLayout = new int[puzzleSize, puzzleSize];
			winLayout = new int[puzzleSize, puzzleSize];
			for (int i = 0; i < linearPuzzle.Length; i++) {
				int row = Mathf.FloorToInt(i / puzzleSize);	
				int col = i % puzzleSize;
				puzzleLayout[row,col]  = linearPuzzle[i];
				
				// The layout for a win. 1 to puzzleSize*puzzleSize, with a blank space at the end
				winLayout[row,col] = i+1;
			}
			
			// Make last element of win layout the zero
			winLayout[puzzleSize-1, puzzleSize-1] = 0;
		}
	}	
	
	
	// Return true if a valid move has been done, return false if no move could be made
	public bool MoveTile(int row, int col) {
		// Check valid row and col
		if (row < 0 || row > puzzleSize-1) {
			Debug.LogError("PCGPuzzle: Invalid puzzle row to move");
			return false;
		}
		if (col < 0 || col > puzzleSize-1) {
			Debug.LogError("PCGPuzzle: Invalid puzzle column to move");
			return false;
		}
		
		// Look for an empty space to move to. Empty space is a Zero (0) value.
		// Check the bounds each time.
		// Look up
		if (row-1 >= 0) {
			// Up only
			if (puzzleLayout[row-1,col] == 0) {
				SwapTiles(row,col,row-1,col);
				return true;
			}
			
			// Up left
			if (col-1 >= 0) {
				if (puzzleLayout[row-1,col-1] == 0) {
					SwapTiles(row,col,row-1,col-1);
					return true;
				}
			}
			
			// Up right
			if (col+1 <= puzzleSize-1) {
				if (puzzleLayout[row-1,col+1] == 0) {
					SwapTiles(row,col,row-1,col+1);
					return true;
				}
			}
		}
		
		// look down
		if (row+1 <= puzzleSize-1) {
			// Down only
			if (puzzleLayout[row+1,col] == 0) {
				SwapTiles(row,col,row+1,col);
				return true;
			}
			
			// Down left
			if (col-1 >= 0) {
				if (puzzleLayout[row+1,col-1] == 0) {
					SwapTiles(row,col,row+1,col-1);
					return true;
				}
			}
			
			// Down right
			if (col+1 <= puzzleSize-1) {
				if (puzzleLayout[row+1,col+1] == 0) {
					SwapTiles(row,col,row+1,col+1);
					return true;
				}
			}
		}
		
		// look left
		if (col-1 >= 0) {
			if (puzzleLayout[row,col-1] == 0) {
				SwapTiles(row,col,row,col-1);
				return true;
			}
		}
		
		// look right
		if (col+1 <= puzzleSize-1) {
			if (puzzleLayout[row,col+1] == 0) {
				SwapTiles(row,col,row,col+1);
				return true;
			}
		}
		
		
		// All moves failed, return false
		return false;
	}
	
	
	public bool IsWin () {
		for (int i = 0; i <= puzzleSize-1; i++) {
			for (int j = 0; j <= puzzleSize-1; j++) {
				if (puzzleLayout[i,j] != winLayout[i,j])
					return false;
			}
		}		
		return true;
	}
	
	
	private void SwapTiles(int row1, int col1, int row2, int col2) {
		int tempValue = puzzleLayout[row1,col1];
		puzzleLayout[row1,col1] = puzzleLayout[row2,col2];
		puzzleLayout[row2,col2] = tempValue;	
	}
}
