#pragma strict

var loginGui : PCGLoginDetailsGUI;
var registerGui : PCGCreateAccountGUI;

var guiSkin : GUISkin;
var cursorImage : Texture;
var buttonSize = Vector2(400,70);
var buttonSeperation = 25;

function Awake() {
	Screen.showCursor = false;
	enabled = true;
}

function OnGUI () {
	Input.ResetInputAxes();
		
	GUI.skin = guiSkin;
	GUI.Box(Rect(0, 0, Screen.width, Screen.height), "Angry Bots: \nThe Procedural Map Generation Edition");

	var loginButtonOffset = new Vector2((Screen.width/2)-(buttonSize.x/2), (Screen.height/2)-buttonSize.y-buttonSeperation);
	var registerButtonOffset = new Vector2((Screen.width/2)-(buttonSize.x/2), (Screen.height/2)+buttonSeperation); 
	
	if (GUI.Button(Rect(loginButtonOffset.x, loginButtonOffset.y, buttonSize.x, buttonSize.y), "Login")) {
		loginGui.enabled = true;
		enabled = false;	
	}
	
	if (GUI.Button(Rect(registerButtonOffset.x, registerButtonOffset.y, buttonSize.x, buttonSize.y), "Create Account")) {
		registerGui.enabled = true;
		enabled = false;	
	}
	
	// Draw cursor last to be on top
	var mousePos : Vector3 = Input.mousePosition;
    var pos : Rect = Rect(mousePos.x,Screen.height - mousePos.y,cursorImage.width/3,cursorImage.height/3);
    GUI.Label(pos,cursorImage);
}