using UnityEngine;
using System.Collections;

public class PCGPuzzleGUI : MonoBehaviour {
	
	public PCGPuzzle puzzle;
	public GameObject doorParentObject;
	
	public GUISkin guiSkin;
	public float nativeVerticalResolution = 1200.0f;
	
	public Vector2 backgroundBoxOffset = new Vector2(100,100);
	public Vector2 backgroundBoxSize = new Vector2(800,800);
	
	public Vector2 puzzleButtonOffset = new Vector2(150,150);
	
	public Vector2 cancelButtonSize = new Vector2(200,50);
	
	void Awake () {
		enabled = false;	
	}
	
	// Draw the puzzle
	void OnGUI () {	
		if (Time.timeScale == 1)
			Time.timeScale = 0;
		
		// Set up gui skin
		GUI.skin = guiSkin;

		// Our GUI is laid out for a 1920 x 1200 pixel display (16:10 aspect). The next line makes sure it rescales nicely to other resolutions.
		GUI.matrix = Matrix4x4.TRS (new Vector3(0, 0, 0), Quaternion.identity, new Vector3(Screen.height / nativeVerticalResolution, Screen.height / nativeVerticalResolution, 1)); 
		
		// Make buttons relative size to background and number of tiles
		float xOffsetDif = 2 * (puzzleButtonOffset.x - backgroundBoxOffset.x);
		float yOffsetDif = 2 * (puzzleButtonOffset.y - backgroundBoxOffset.y);
		float xButtonSize = (backgroundBoxSize.x/puzzle.puzzleSize) - (xOffsetDif/puzzle.puzzleSize);
		float yButtonSize = (backgroundBoxSize.y/puzzle.puzzleSize) - (yOffsetDif/puzzle.puzzleSize);
		
		GUI.Box(new Rect(backgroundBoxOffset.x, backgroundBoxOffset.y, backgroundBoxSize.x, backgroundBoxSize.y), "Door Puzzle");
		Vector2 cancelButtonOffset = new Vector2((backgroundBoxOffset.x+backgroundBoxSize.x)-cancelButtonSize.x, (backgroundBoxOffset.y+backgroundBoxSize.y)-cancelButtonSize.y);
		if (GUI.Button(new Rect(cancelButtonOffset.x, cancelButtonOffset.y, cancelButtonSize.x, cancelButtonSize.y), "Cancel")) {
			puzzle.puzzleLocked = true;
			Time.timeScale = 1;
			enabled = false;
		}
		
		for (int i = 0; i <= puzzle.puzzleSize-1; i++) {
			for (int j = 0; j <= puzzle.puzzleSize-1; j++) {
				float xOffset = puzzleButtonOffset.x+((float)j*xButtonSize);
				float yOffset = puzzleButtonOffset.y+((float)i*yButtonSize);
				
				if (puzzle.puzzleLayout[i,j] == 0)		
					GUI.Box(new Rect(xOffset,yOffset,xButtonSize,yButtonSize), "");
				else {
					if (GUI.Button(new Rect(xOffset,yOffset,xButtonSize,yButtonSize), puzzle.puzzleLayout[i,j].ToString())) {
						puzzle.MoveTile(i,j);
						if (puzzle.IsWin()) {
							puzzle.puzzleLocked = false;
							doorParentObject.SendMessage("ManualTriggerEnter");
							Time.timeScale = 1;
							collider.isTrigger = true;
							enabled = false;
						}
					}				
				}
			}
		}
	}
}