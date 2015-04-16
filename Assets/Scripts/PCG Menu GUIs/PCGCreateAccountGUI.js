#pragma strict

var mainMenu : PCGLoginMethodGUI;
var loadingScreen : PCGLoadingGUI;
private var timeToRelease : boolean;
private var goodID : boolean;

var networkManager : PCGTreeNetworkManager;

var guiSkin : GUISkin;
var cursorImage : Texture;

var backgroundSize = Vector2(600,200);

var buttonSize = Vector2(200,70);
var buttonSeperation = 25;

var inputBoxSize = Vector2(300,30);
var playerID : String = "0001";
var password : String = "";
//var rePassword : String = "";

var warningLabel : String; 
var labelSize= new Vector2(400,30);

function Awake() {
	enabled = false;
}

function OnEnable() {
	// Generate a new User ID
	goodID = false;
	playerID = PCGTreeNetworkManager.RandomID();
	networkManager.lastMsg = PCGTreeNetworkManager.msg_idExists;	
	networkManager.CheckAndHoldID(playerID);
	
	//password = "";
    //rePassword = "";
    /* Generate password. Storing peoples own passwords poses a security problem for ethics */
    password = PCGTreeNetworkManager.RandomPassword();
    warningLabel = "This is your new User ID and Password.\nPlease write it down to remember it.";
    
    timeToRelease = false;
}

function OnApplicationQuit() {
	networkManager.ReleaseID(playerID);	
}

function OnGUI () {	
	// If the first id was no good, keep generating
	if (!goodID) {
		if (networkManager.lastMsg == PCGTreeNetworkManager.msg_idExists) {
			timeToRelease = true;
			networkManager.ReleaseID(playerID);			
		} 
		else if(networkManager.lastMsg == PCGTreeNetworkManager.msg_success) {
			if (timeToRelease) {				
				timeToRelease = false;
				playerID = PCGTreeNetworkManager.RandomID();
				networkManager.CheckAndHoldID(playerID);
			}
			else {
				goodID = true;
				timeToRelease = false;
				networkManager.lastMsg = "";
			}
		}
	}
	
	// Otherwise, run the gui
	else {
		// Background	
		GUI.skin = guiSkin;
		GUI.Box(Rect(0, 0, Screen.width, Screen.height), "Angry Bots: \nThe Procedural Map Generation Edition");
		
		// Input boxes
		//var rePwdOffset = new Vector2((Screen.width/2)-(inputBoxSize.x/2), (Screen.height/2)-inputBoxSize.y);
		//var pwdOffset = new Vector2(rePwdOffset.x, rePwdOffset.y-inputBoxSize.y-buttonSeperation);
		var pwdOffset = new Vector2((Screen.width/2)+(buttonSeperation/2), (Screen.height/2)-inputBoxSize.y);
		var idOffset = new Vector2(pwdOffset.x, pwdOffset.y-inputBoxSize.y-buttonSeperation);
		
		var idLabelOffset = new Vector2(idOffset.x-labelSize.x-buttonSeperation, idOffset.y);
		var pwdLabelOffset = new Vector2(pwdOffset.x-labelSize.x-buttonSeperation, pwdOffset.y);
		//var rePwdLabelOffset = new Vector2(rePwdOffset.x-labelSize.x-buttonSeperation, rePwdOffset.y);
		
		
		GUI.Label(Rect(idOffset.x, idOffset.y, inputBoxSize.x, inputBoxSize.y), playerID, GUI.skin.customStyles[0]);
		GUI.Label(Rect(pwdOffset.x, pwdOffset.y, inputBoxSize.x, inputBoxSize.y), password, GUI.skin.customStyles[0]);
		//password = GUI.PasswordField(Rect(pwdOffset.x, pwdOffset.y, inputBoxSize.x, inputBoxSize.y), password,"*"[0]);
		//rePassword = GUI.PasswordField(Rect(rePwdOffset.x, rePwdOffset.y, inputBoxSize.x, inputBoxSize.y), rePassword,"*"[0]);
		
		GUI.Label(Rect(idLabelOffset.x, idLabelOffset.y, labelSize.x, inputBoxSize.y), "Your new User ID is:", GUI.skin.customStyles[1]);
		GUI.Label(Rect(pwdLabelOffset.x, pwdLabelOffset.y, labelSize.x, inputBoxSize.y), "New Password: ", GUI.skin.customStyles[1]);
		//GUI.Label(Rect(rePwdLabelOffset.x, rePwdLabelOffset.y, labelSize.x, inputBoxSize.y), "Retype Password:", GUI.skin.customStyles[1]);
		
		// Warning label
		var warningOffset = new Vector2((Screen.width/2)-(labelSize.x/2), (Screen.height/2)+buttonSeperation);
		GUI.Label(Rect(warningOffset.x, warningOffset.y, labelSize.x, labelSize.y+20),warningLabel); 
		
		// Buttons
		var backButtonOffset = new Vector2((Screen.width/2)-buttonSeperation-(buttonSize.x), warningOffset.y+labelSize.y+buttonSeperation);
		var createButtonOffset = new Vector2((Screen.width/2)+buttonSeperation, warningOffset.y+labelSize.y+buttonSeperation);
		
		if (GUI.Button(Rect(backButtonOffset.x, backButtonOffset.y, buttonSize.x, buttonSize.y), "Cancel")) {
			networkManager.ReleaseID(playerID);
			mainMenu.enabled = true;
			enabled = false;	
		}
		
		if (GUI.Button(Rect(createButtonOffset.x, createButtonOffset.y, buttonSize.x, buttonSize.y), "Login")) {
			var allGood : boolean = true;
			
			/*
			if (password == "")
				warningLabel = "Please enter a Password.";
			else {
				if (rePassword == "")
					warningLabel = "Please retype your Password above.";
				else {
					if (password.Length<6)
						warningLabel = "The password must be at least 6 characters long.";
					else {
						if (password != rePassword)
							warningLabel = "The two passwords did not match. Please retype them.";
						else
							allGood = true;
					}
				}
			}*/
			
			if (allGood) {
				warningLabel = "Please Wait...";
				networkManager.ReleaseID(playerID);			
			}	
		}
		
		// Draw cursor last to be on top
		var mousePos : Vector3 = Input.mousePosition;
	    var pos : Rect = Rect(mousePos.x,Screen.height - mousePos.y,cursorImage.width/3,cursorImage.height/3);
	    GUI.Label(pos,cursorImage);
	    
	    // Check server reply asynchronously
	    if (!timeToRelease) {
	    	if (networkManager.lastMsg != "") {
			    if (networkManager.lastMsg == PCGTreeNetworkManager.msg_success) {
			    	networkManager.NewUser(playerID, password);
					timeToRelease = true;
				}
				else {
					warningLabel = "(Report this error) Release ID Error: " + networkManager.lastMsg;
				}
			}
	    }
	    else {
	    	var readyToLoad : boolean = false;
		   	if (networkManager.lastMsg != "") {
			    if (networkManager.lastMsg == PCGTreeNetworkManager.msg_success) {
					readyToLoad = true;
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
	}
}