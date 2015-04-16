#pragma strict
private var mapManager : PCGTreeNEATMapManager;

var guiSkin : GUISkin;
var cursorImage : Texture;

var backgroundSize = Vector2(800,800);

var fieldSize = Vector2(50,50);
var tableTitleFontSize = 20;
var tableFieldFontSize = 10;

var buttonSize = Vector2(110,70);
var buttonSeperation = 20;

var playerScoreString : String = "0\n0\n0\n0\n0\n0\n0\n0\n0";
var highScoreString : String = "0,NA\n0,NA\n0,NA\n0,NA\n0,NA\n0,NA\n0,NA\n0,NA\n0,NA";

function Awake() {
	mapManager = gameObject.GetComponent(PCGTreeNEATMapManager);
	enabled = false;
}

function OnGUI () {
		
	Input.ResetInputAxes();
	if (Time.timeScale == 1)
		Time.timeScale = 0;
		
	GUI.skin = guiSkin;
	var backgroundOffset = new Vector2((Screen.width/2)-(backgroundSize.x/2), (Screen.height/2)-(backgroundSize.y/2));
	GUI.Box(Rect(backgroundOffset.x, backgroundOffset.y, backgroundSize.x, backgroundSize.y), "High Scores");

	
	// Drawing the highscore table
	var originalFontSize = GUI.skin.customStyles[3].fontSize;
   	var titles = ["Item","Your\nScore","Top Score","Top Score\nOwner"];
   	var items = ["Maps\nCompleted","Rooms\nVisited","Spiders\nKilled","BuzzBots\nKilled","Mechs\nKilled","Ammo\nPicked-up","Health\nPicked-up","Weapons\nExamined","Weapons\nPicked-up"];
   	var playerScoreLines = playerScoreString.Split("\n"[0]);
   	var highScoreLines = highScoreString.Split("\n"[0]);
   	
   	var tableOffset = new Vector2((Screen.width/2)-((titles.Length/2)*fieldSize.x), (Screen.height/2)-((items.Length/2)*fieldSize.y)-buttonSize.y);
   	for (var row : int = 0; row < items.Length+1; row++) {
   		tableOffset.x = (Screen.width/2)-((titles.Length/2)*fieldSize.x);
   		
   		for (var col : int = 0; col < titles.Length; col++) {
   			// Title row
   			if (row == 0) {
   				GUI.skin.customStyles[3].fontSize = tableTitleFontSize;
   				GUI.Label(Rect(tableOffset.x,tableOffset.y,fieldSize.x,fieldSize.y), titles[col], GUI.skin.customStyles[3]);
   				GUI.skin.customStyles[3].fontSize = tableFieldFontSize;
   			}
   			else {
   				// Item column
   				if (col == 0) {
   					GUI.skin.customStyles[3].fontSize = tableTitleFontSize;
   					GUI.Label(Rect(tableOffset.x,tableOffset.y,fieldSize.x,fieldSize.y), items[row-1], GUI.skin.customStyles[3]);
   					GUI.skin.customStyles[3].fontSize = tableFieldFontSize;
   				}
   				else if (col == 1)  
   					GUI.Label(Rect(tableOffset.x,tableOffset.y,fieldSize.x,fieldSize.y), playerScoreLines[row-1], GUI.skin.customStyles[3]);
   				else if (col == 2) {
   					var highScoreData = highScoreLines[row-1].Split(","[0]);
   					GUI.Label(Rect(tableOffset.x,tableOffset.y,fieldSize.x,fieldSize.y), highScoreData[0], GUI.skin.customStyles[3]);
   				}
   				else if (col == 3) {
   					highScoreData = highScoreLines[row-1].Split(","[0]);
   					if (highScoreData[1].Equals(mapManager.networkManager.currentPlayerID))
   						GUI.Label(Rect(tableOffset.x,tableOffset.y,fieldSize.x,fieldSize.y), "YOU", GUI.skin.customStyles[3]);
   					else
   				   		GUI.Label(Rect(tableOffset.x,tableOffset.y,fieldSize.x,fieldSize.y), highScoreData[1], GUI.skin.customStyles[3]);		   				
   				}
   			}   			
   			tableOffset.x = tableOffset.x+fieldSize.x;   			
   		}
   		tableOffset.y = tableOffset.y+fieldSize.y;
   	}
	// Reset the font size                 
    GUI.skin.customStyles[3].fontSize = originalFontSize;
	
	// Menu button
	var buttonOffset = new Vector2((Screen.width/2)-(buttonSize.x/2), tableOffset.y);	
	if (GUI.Button(Rect(buttonOffset.x, buttonOffset.y, buttonSize.x, buttonSize.y), "Menu")) {
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.ShowStartScreen;
		enabled = false;	
	}
	
	// Draw cursor last to be on top
	var mousePos : Vector3 = Input.mousePosition;
    var pos : Rect = Rect(mousePos.x,Screen.height - mousePos.y,cursorImage.width/3,cursorImage.height/3);
    GUI.Label(pos,cursorImage);
}