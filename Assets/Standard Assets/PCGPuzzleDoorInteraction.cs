using UnityEngine;
using System.Collections;

public class PCGPuzzleDoorInteraction : MonoBehaviour {
	
	public PCGPuzzleGUI puzzleGUI;
	
	public void InteractWithPlayer () {
		if (puzzleGUI.puzzle.puzzleLocked)
			puzzleGUI.enabled = true;
	}
}
