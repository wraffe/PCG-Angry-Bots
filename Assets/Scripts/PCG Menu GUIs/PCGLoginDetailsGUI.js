#pragma strict

var mainMenu : PCGLoginMethodGUI;
var loadingScreen : PCGLoadingGUI;

var networkManager : PCGTreeNetworkManager;

var guiSkin : GUISkin;
var cursorImage : Texture;

var backgroundSize = Vector2(600,200);

var buttonSize = Vector2(200,70);
var buttonSeperation = 25;

var inputBoxSize = Vector2(300,30);
var playerID : String = "";
var password : String = "";

var warningLabel : String = "";
var labelSize = new Vector2(400,35);

var defaultUser : boolean = false;

function Awake() {
	enabled = false;
}

function OnEnable() {
	playerID = "";
	password = "";
	warningLabel = "";
	networkManager.lastMsg = "";
}

function OnGUI () {	
	// Background	
	GUI.skin = guiSkin;
	GUI.Box(Rect(0, 0, Screen.width, Screen.height), "Angry Bots: \nThe Procedural Map Generation Edition");
	
	// Grey out the input fields if the user chooses to login as default
	if (defaultUser)
		GUI.enabled = false;
	
	// Input boxes
	var pwdOffset = new Vector2((Screen.width/2)-(inputBoxSize.x/2), (Screen.height/2)-inputBoxSize.y);
	var idOffset = new Vector2((Screen.width/2)-(inputBoxSize.x/2), pwdOffset.y-inputBoxSize.y-buttonSeperation);
	
	var idLabelOffset = new Vector2(idOffset.x-labelSize.x-buttonSeperation, idOffset.y);
	var pwdLabelOffset = new Vector2(pwdOffset.x-labelSize.x-buttonSeperation, pwdOffset.y);
	
	playerID = GUI.TextField(Rect(idOffset.x, idOffset.y, inputBoxSize.x, inputBoxSize.y), playerID);
	password = GUI.PasswordField(Rect(pwdOffset.x, pwdOffset.y, inputBoxSize.x, inputBoxSize.y), password, "*"[0]);
	
	GUI.Label(Rect(idLabelOffset.x, idLabelOffset.y, labelSize.x, inputBoxSize.y), "User ID:", GUI.skin.customStyles[1]);
	GUI.Label(Rect(pwdLabelOffset.x, pwdLabelOffset.y, labelSize.x, inputBoxSize.y), "Password:", GUI.skin.customStyles[1]);	
	
	// Re-enable so that the buttons arent greyed out
	if (defaultUser)
		GUI.enabled = true; 
		
	// Default user check box
	var defaultOffset = new Vector2((Screen.width/2)-(labelSize.x/2), (Screen.height/2)+buttonSeperation);
	//defaultUser = GUI.Toggle(Rect(defaultOffset.x, defaultOffset.y, labelSize.x, labelSize.y), defaultUser, "Login as Default User \n(note: this account can be accessed by anyone)");
	
	// Warning label
	var warningOffset = new Vector2(defaultOffset.x, defaultOffset.y+labelSize.y+buttonSeperation);
	GUI.Label(Rect(warningOffset.x, warningOffset.y, labelSize.x, labelSize.y),warningLabel); 
	
	// Buttons
	var backButtonOffset = new Vector2((Screen.width/2)-buttonSeperation-(buttonSize.x), warningOffset.y+labelSize.y+buttonSeperation);
	var loginButtonOffset = new Vector2((Screen.width/2)+buttonSeperation, warningOffset.y+labelSize.y+buttonSeperation);
	
	if (GUI.Button(Rect(backButtonOffset.x, backButtonOffset.y, buttonSize.x, buttonSize.y), "Back")) {
		mainMenu.enabled = true;
		enabled = false;	
	}
	
	if (GUI.Button(Rect(loginButtonOffset.x, loginButtonOffset.y, buttonSize.x, buttonSize.y), "Login")) {
		if (defaultUser) {
			playerID = "default";
			password = "123456";
		}
		
		var allGood : boolean = false;
		
		if (playerID == "")
			warningLabel = "Please enter a User ID";
		else {
			if (password == "")
				warningLabel = "Please enter a Password";
			else
				allGood = true;
		}
		
		if (allGood) {	
			warningLabel = "Please Wait...";	
			networkManager.ConfirmLogin(playerID, password);
		}
	}
	
	// Draw cursor last to be on top
	var mousePos : Vector3 = Input.mousePosition;
    var pos : Rect = Rect(mousePos.x,Screen.height - mousePos.y,cursorImage.width/3,cursorImage.height/3);
    GUI.Label(pos,cursorImage);
    
    // Check server replies for next gui draw
    var readyToLoad : boolean = false;
   	if (networkManager.lastMsg != "") {
	    if (networkManager.lastMsg == PCGTreeNetworkManager.msg_success) {
			readyToLoad = true;
		}
		else if (networkManager.lastMsg == PCGTreeNetworkManager.msg_loginFail) {
			warningLabel = "The username or password is incorrect.";
		}
		else {
			warningLabel = "(Report this error) Login Error: " + networkManager.lastMsg;
		}
	}
	if (readyToLoad) {
		networkManager.currentPlayerID = playerID;	
		Application.LoadLevel("_PCG_MainGame");	
		loadingScreen.enabled = true;
		enabled = false;
	}
}