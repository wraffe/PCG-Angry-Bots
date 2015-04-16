#pragma strict

var guiSkin : GUISkin;

var loadMessage : String = "Loading Map";
private var hints : String[] = ["If a map is too difficult, press 'Esc' and skip the map.",
						"Even if you skip a map you will still be able to leave a rating for it.",
						"There is a Survey that is accessible from the Main Menu.\nOnce you have finished playing, we would love to hear about your experience.",
						"Hold 'Left Shift' to walk slowly and sneak past Spider Bots.",
						"If you sneak up to a Spider Bot, press 'E' to safely destroy them. This will save you ammo.",
						"To open Health, Ammo, and Weapon crates, stand next to them and press 'E'."];
var hintInd : int = 0;
var loadingCount : int = 0;

var loadingLabelSize = Vector2(600,70);

private var loadingDots : int = 0;
private var loadingTimer : float = 0;
private var loadingText : String;

function Awake() {
	enabled = false;
}

function OnEnable() {
	if (loadingCount < 2) {
		hintInd = 0;
		loadingCount++;
	}
	else { 
		hintInd++;
		if (hintInd == hints.Length)
			hintInd = 0;
	}
}

function OnGUI () {
	Input.ResetInputAxes();
	
	GUI.skin = guiSkin;
	GUI.Box(Rect(0, 0, Screen.width, Screen.height), "");

	var loadingLabelOffset = new Vector2((Screen.width/2)-(loadingLabelSize.x/2), (Screen.height/2)-(loadingLabelSize.y/2));
	
	loadingTimer += Time.deltaTime;
	if (loadingTimer >= 1) {
		loadingDots++;
		if (loadingDots > 4)
			loadingDots = 0;
		loadingTimer = 0;
	}
	
	loadingText = loadMessage;
	for (var i = 0; i < loadingDots; i++)
		loadingText = loadingText + ".";
	
	GUI.Label(Rect(loadingLabelOffset.x, loadingLabelOffset.y, loadingLabelSize.x, loadingLabelSize.y), loadingText);
	GUI.Label(Rect(loadingLabelOffset.x, loadingLabelOffset.y+25, loadingLabelSize.x, loadingLabelSize.y), "Hint: "+hints[hintInd], GUI.skin.customStyles[1]);
}