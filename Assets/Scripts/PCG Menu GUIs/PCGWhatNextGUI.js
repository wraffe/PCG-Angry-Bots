#pragma strict
private var mapManager : PCGTreeNEATMapManager;

var guiSkin : GUISkin;
var cursorImage : Texture;

var backgroundSize = Vector2(800,200);

var buttonSize = Vector2(110,70);
var buttonSeperation = 20;

var selGridInt : int = 0;
var selStrings : String[]; 
var selGridSize = Vector2(500,200);

@HideInInspector
var lastRating : int = 1;

function Awake() {
	/*selStrings = ["Keep the same map structure but change the enemies and\npick-ups within the map.",
					"Generate more map structures similar to the one I just played."];*/
	selStrings = ["Generate new maps based on my profile", "Generate a new map randomly","Return to main menu"];
	mapManager = gameObject.GetComponent(PCGTreeNEATMapManager);
	enabled = false;
}

function OnEnable() {
	selGridInt = 0;
}

function OnGUI () {
	Input.ResetInputAxes();
	if (Time.timeScale == 1)
		Time.timeScale = 0;
		
	GUI.skin = guiSkin;
	var backgroundOffset = new Vector2((Screen.width/2)-(backgroundSize.x/2), (Screen.height/2)-(backgroundSize.y/2));
	GUI.Box(Rect(backgroundOffset.x, backgroundOffset.y, backgroundSize.x, backgroundSize.y), "What would you like to do?");
	
	var selGridOffset = new Vector2((Screen.width/2)-(selGridSize.x/2), (Screen.height/2)-(buttonSeperation/2)-(selGridSize.y/2));
	selGridInt = GUI.SelectionGrid (Rect (selGridOffset.x, selGridOffset.y, selGridSize.x, selGridSize.y), selGridInt, selStrings, 1, GUI.skin.toggle);
	
	var buttonOffset = new Vector2((Screen.width/2)-(buttonSize.x/2), (Screen.height/2)+(buttonSeperation/2));
	if (GUI.Button(Rect(buttonOffset.x, buttonOffset.y, buttonSize.x, buttonSize.y), "Continue")) {
		lastRating = 0;
		Time.timeScale = 1;
		/*if (selGridInt == 0)
			mapManager.gameState = PCG_STATE.EvolveContent;
		else if (selGridInt == 1)
			mapManager.gameState = PCG_STATE.EvolveGeometry; */
		if (selGridInt == 0) {
			mapManager.gameState = PCG_STATE.EvolveGeometry;
			mapManager.buildMode = PCG_METHOD.Optimize;			
		}
		else if (selGridInt == 1) {
			mapManager.gameState = PCG_STATE.EvolveGeometry;
			mapManager.buildMode = PCG_METHOD.Randomize;
		}
		else if (selGridInt == 2) {
			mapManager.gameState = PCG_STATE.ShowStartScreen;
			mapManager.buildMode = PCG_METHOD.Optimize;	
		}
		enabled = false;	
	}
	
	// Draw cursor last to be on top
	var mousePos : Vector3 = Input.mousePosition;
    var pos : Rect = Rect(mousePos.x,Screen.height - mousePos.y,cursorImage.width/3,cursorImage.height/3);
    GUI.Label(pos,cursorImage);
}