#pragma strict
private var mapManager : PCGTreeNEATMapManager;

var guiSkin : GUISkin;
var cursorImage : Texture;

var backgroundSize = Vector2(800,200);

var buttonSize = Vector2(110,70);
var buttonSeperation = 20;
var buttonFontSize = 10;

@HideInInspector
var lastRating : int = 1;

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
	GUI.Box(Rect(backgroundOffset.x, backgroundOffset.y, backgroundSize.x, backgroundSize.y), "How would you rate \nthe map you just played?");
	
	/*
	var firstStarOffset = new Vector2((Screen.width/2)-(buttonSeperation/2)-(buttonSize.x), (Screen.height/2)-(buttonSize.y/2));
	if (GUI.Button(Rect(firstStarOffset.x, firstStarOffset.y, buttonSize.x, buttonSize.y), "Disliked")) {
		lastRating = 0;
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.SendNetworkData;
		enabled = false;	
	}
	
	if (GUI.Button(Rect(firstStarOffset.x+buttonSize.x+buttonSeperation, firstStarOffset.y, buttonSize.x, buttonSize.y), "Liked")) {
		lastRating = 1;
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.SendNetworkData;
		enabled = false;	
	} */
	
	var oldFontSize = guiSkin.button.fontSize;
	guiSkin.button.fontSize = buttonFontSize;
	
	var firstStarOffset = new Vector2((Screen.width/2)-(buttonSeperation*2)-(buttonSize.x*3)-(buttonSeperation/2), (Screen.height/2)-(buttonSize.y/2));
	if (GUI.Button(Rect(firstStarOffset.x, firstStarOffset.y, buttonSize.x, buttonSize.y), "Very Bad")) {
		lastRating = 1;
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.SendNetworkData;
		enabled = false;	
	}
	
	if (GUI.Button(Rect(firstStarOffset.x+buttonSize.x+buttonSeperation, firstStarOffset.y, buttonSize.x, buttonSize.y), "Bad")) {
		lastRating = 2;
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.SendNetworkData;
		enabled = false;	
	}
	
	if (GUI.Button(Rect(firstStarOffset.x+buttonSize.x*2+buttonSeperation*2, firstStarOffset.y, buttonSize.x, buttonSize.y), "Poor")) {
		lastRating = 3;
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.SendNetworkData;
		enabled = false;	
	}
	
	if (GUI.Button(Rect(firstStarOffset.x+buttonSize.x*3+buttonSeperation*3, firstStarOffset.y, buttonSize.x, buttonSize.y), "Fair")) {
		lastRating = 4;
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.SendNetworkData;
		enabled = false;	
	}
	
	if (GUI.Button(Rect(firstStarOffset.x+buttonSize.x*4+buttonSeperation*4, firstStarOffset.y, buttonSize.x, buttonSize.y), "Good")) {
		lastRating = 5;
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.SendNetworkData;
		enabled = false;	
	}
	
	if (GUI.Button(Rect(firstStarOffset.x+buttonSize.x*5+buttonSeperation*5, firstStarOffset.y, buttonSize.x, buttonSize.y), "Very Good")) {
		lastRating = 6;
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.SendNetworkData;
		enabled = false;	
	}
	
	guiSkin.button.fontSize = oldFontSize;
	
	// Draw cursor last to be on top
	var mousePos : Vector3 = Input.mousePosition;
    var pos : Rect = Rect(mousePos.x,Screen.height - mousePos.y,cursorImage.width/3,cursorImage.height/3);
    GUI.Label(pos,cursorImage);
}