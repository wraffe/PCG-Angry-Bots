#pragma strict

private var mapManager : PCGTreeNEATMapManager;

var guiSkin : GUISkin;
var cursorImage : Texture;

var backgroundSize = Vector2(600,200);

var buttonSize = Vector2(200,70);
var buttonSeperation = 25;

private var logger : PCGGenericLogger;

function Awake() {
	mapManager = gameObject.GetComponent(PCGTreeNEATMapManager);
	
	logger = gameObject.GetComponent(PCGGenericLogger);
	if (logger == null)
		Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
			
	enabled = false;
}


function OnGUI () {
	if (Input.GetButtonDown("Pause") && Time.timeScale == 0) {
		Time.timeScale = 1;
		enabled = false;		
	}
	
	Input.ResetInputAxes();
	if (Time.timeScale == 1 && enabled)
		Time.timeScale = 0;
		
	GUI.skin = guiSkin;
	var backgroundOffset = new Vector2((Screen.width/2)-(backgroundSize.x/2), (Screen.height/2)-(backgroundSize.y/2));
	GUI.Box(Rect(backgroundOffset.x, backgroundOffset.y, backgroundSize.x, backgroundSize.y), "Game Paused");
	
	var retryButtonOffset = new Vector2((Screen.width/2)-buttonSeperation-(buttonSize.x), (Screen.height/2)-(buttonSize.y/2));
	var continueButtonOffset = new Vector2((Screen.width/2)+buttonSeperation, (Screen.height/2)-(buttonSize.y/2));
	
	if (GUI.Button(Rect(retryButtonOffset.x, retryButtonOffset.y, buttonSize.x, buttonSize.y), "Restart Map")) {
		mapManager.gameState = PCG_STATE.PlayMap;
		if (logger != null) {
			logger.AddEntry("restarted Map");
			logger.ResetStats();
		}
		Time.timeScale = 1;
		enabled = false;	
	}
	
	if (GUI.Button(Rect(continueButtonOffset.x, continueButtonOffset.y, buttonSize.x, buttonSize.y), "New Map")) {
		mapManager.gameState = PCG_STATE.RateMap;
		if (logger != null)
			logger.AddEntry("unpaused");
		Time.timeScale = 1;
		enabled = false;	
	}
	
	// Draw cursor last to be on top
	var mousePos : Vector3 = Input.mousePosition;
    var pos : Rect = Rect(mousePos.x,Screen.height - mousePos.y,cursorImage.width/3,cursorImage.height/3);
    GUI.Label(pos,cursorImage);
}

