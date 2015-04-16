#pragma strict
private var mapManager : PCGTreeNEATMapManager;

var guiSkin : GUISkin;
var cursorImage : Texture;
var buttonSize = Vector2(400,70);
var buttonSeperation = 20;
var firstTurn : boolean;

function Awake() {
	mapManager = gameObject.GetComponent(PCGTreeNEATMapManager);
	firstTurn = false;
	enabled = false;
}

function OnGUI () {
	Input.ResetInputAxes();
	if (Time.timeScale == 1)
		Time.timeScale = 0;
		
	GUI.skin = guiSkin;
	GUI.Box(Rect(0, 0, Screen.width, Screen.height), "Angry Bots: \nThe Procedural Map Generation Edition");

	var button1Offset = new Vector2((Screen.width/2)-(buttonSize.x/2), (Screen.height/2)-(buttonSize.y*2)-buttonSeperation-(buttonSeperation/2));
	var startMsg = "Continue Game";
	if (firstTurn)
		startMsg = "Start Game";
	if (GUI.Button(Rect(button1Offset.x, button1Offset.y, buttonSize.x, buttonSize.y), startMsg)) {
		Time.timeScale = 1;
		firstTurn = false;
		mapManager.gameState = PCG_STATE.EvolveGeometry;
		enabled = false;	
	}
	
	var button2Offset = new Vector2((Screen.width/2)-(buttonSize.x/2), (Screen.height/2)-buttonSize.y-(buttonSeperation/2));
	if (GUI.Button(Rect(button2Offset.x, button2Offset.y, buttonSize.x, buttonSize.y), "Tutorial")) {
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.ShowTutorial;
		enabled = false;	
	}
	
	var button3Offset = new Vector2((Screen.width/2)-(buttonSize.x/2), (Screen.height/2)+(buttonSeperation/2));
	if (GUI.Button(Rect(button3Offset.x, button3Offset.y, buttonSize.x, buttonSize.y), "High Scores")) {
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.ShowHighScores;
		enabled = false;	
	}
	
	var button4Offset = new Vector2((Screen.width/2)-(buttonSize.x/2), (Screen.height/2)+buttonSize.y+buttonSeperation+(buttonSeperation/2));
	if (GUI.Button(Rect(button4Offset.x, button4Offset.y, buttonSize.x, buttonSize.y), "Survey")) {
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.ShowSurvey;
		enabled = false;	
	}
	
	GUI.skin.button.fontSize = 10;
	var smallButtonSize = Vector2(200,30);		
	if (GUI.Button(Rect(20, Screen.height-smallButtonSize.y-20, smallButtonSize.x, smallButtonSize.y), "Experiment Info")) {
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.ShowExperimentInfo;
		enabled = false;	
	} 	
	GUI.skin.button.fontSize = 0;
	
	// Draw cursor last to be on top
	var mousePos : Vector3 = Input.mousePosition;
    var pos : Rect = Rect(mousePos.x,Screen.height - mousePos.y,cursorImage.width/3,cursorImage.height/3);
    GUI.Label(pos,cursorImage);
    
    /* Load and capture all geometries listed in a file */
    if (Event.current.Equals(Event.KeyboardEvent("f8"))) {
    	if (mapManager.networkManager.currentPlayerID.Equals("test3"))
    	{
    		Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.AwaitingPlayer;
			StartCoroutine(mapManager.CaptureGeomListFromFile());
			enabled = false;
    	}
    }   
    
    /* Random geometry generation test to see validation failure rate */
    if (Event.current.Equals(Event.KeyboardEvent("f9"))) {
    	if (mapManager.networkManager.currentPlayerID.Equals("test3"))
    	{
    		Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.Loading;
			StartCoroutine(mapManager.RandomGeomTest());
			enabled = false;
    	}
    }
    
    /*** CPPN debug mode to test CPPN against multiple random geometries ***/
    if (Event.current.Equals(Event.KeyboardEvent("f10"))) {
    	if (mapManager.networkManager.currentPlayerID.Equals("test3"))
    	{
    		Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.CPPNDebug;
			enabled = false;
    	}
    }
    
    /*** CPPN repair mode ***/
    if (Event.current.Equals(Event.KeyboardEvent("f11"))) {
    	if (mapManager.networkManager.currentPlayerID.Equals("test3"))
    	{
    		Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.Loading;
			mapManager.RepairCPPNGenomes();
			enabled = false;
    	}
    }
    
    /*** Geometry debug mode to load maps to view ***/
    if (Event.current.Equals(Event.KeyboardEvent("f12"))) {
    	if (mapManager.networkManager.currentPlayerID.Equals("test3"))
    	{
    		Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.GeomDebug;
			enabled = false;
    	}
    }
}