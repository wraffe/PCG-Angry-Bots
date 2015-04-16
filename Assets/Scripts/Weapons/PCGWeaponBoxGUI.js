var newWeapon : PCGWeaponBoxContents;
var interactionController : PCGWeaponBoxInteraction;

var titleSkin : GUISkin;
var labelSkin : GUISkin;
var weaponImage : Texture;
var nativeVerticalResolution : float = 1200.0;

var backgroundBoxOffset = Vector2(200,200);
var backgroundBoxSize = Vector2(750,625);

var subBoxOffset = Vector2(250,250);
var subBoxSize = Vector2(300,500);
var subBoxDivide : float = 50.0f;

var optionButtonsSize = Vector2(200,50);

var descriptionRelativeOffset = Vector2(10,300);
var labelSize = Vector2(300,50);

var imageRelOffset = Vector2(10,20);
var imgSize = Vector2(275,300);
var imgAspectRatio : float = 3.0f;

function Awake () {
	enabled = false;
}


function OnGUI () {
	Input.ResetInputAxes();
	if (Time.timeScale == 1)
		Time.timeScale = 0;
		
	// Our GUI is laid out for a 1920 x 1200 pixel display (16:10 aspect). The next line makes sure it rescales nicely to other resolutions.
	GUI.matrix = Matrix4x4.TRS (Vector3(0, 0, 0), Quaternion.identity, Vector3(Screen.height / nativeVerticalResolution, Screen.height / nativeVerticalResolution, 1));
		
	GUI.skin = titleSkin;	
	GUI.Box(Rect(backgroundBoxOffset.x, backgroundBoxOffset.y, backgroundBoxSize.x, backgroundBoxSize.y), "Weapon Swap");
	
	GUI.skin = labelSkin;
	
	// Description of new weapon
	GUI.Box(Rect(subBoxOffset.x, subBoxOffset.y, subBoxSize.x, subBoxSize.y), "New Weapon");
	var xOffset : float = subBoxOffset.x + descriptionRelativeOffset.x;
	var yOffset : float = subBoxOffset.y + descriptionRelativeOffset.y;
	GUI.Label(Rect(xOffset, yOffset, labelSize.x, labelSize.y), "Rate of Fire : " + newWeapon.rateOfFire);
	yOffset = yOffset+labelSize.y;
	GUI.Label(Rect(xOffset, yOffset, labelSize.x, labelSize.y), "Strength : " + newWeapon.damagePerShot);
	yOffset = yOffset+labelSize.y;
	GUI.Label(Rect(xOffset, yOffset, labelSize.x, labelSize.y), "Knockback : " + newWeapon.forcePerShot);
	
	
	// Description of old weapon
	var subBoxOffset2 = Vector2(subBoxOffset.x+subBoxSize.x+subBoxDivide, subBoxOffset.y);
	GUI.Box(Rect(subBoxOffset2.x, subBoxOffset2.y, subBoxSize.x, subBoxSize.y), "Old Weapon");
	xOffset = subBoxOffset2.x + descriptionRelativeOffset.x;
	yOffset = subBoxOffset.y + descriptionRelativeOffset.y;
	GUI.Label(Rect(xOffset, yOffset, labelSize.x, labelSize.y), "Rate of Fire : " + newWeapon.playersStartingWeapon.rateOfFire);
	yOffset = yOffset+labelSize.y;
	GUI.Label(Rect(xOffset, yOffset, labelSize.x, labelSize.y), "Strength : " + newWeapon.playersStartingWeapon.damagePerShot);
	yOffset = yOffset+labelSize.y;
	GUI.Label(Rect(xOffset, yOffset, labelSize.x, labelSize.y), "Knockback : " + newWeapon.playersStartingWeapon.forcePerShot);
	
	// Images of weapons
	if (weaponImage != null) {
		xOffset = subBoxOffset.x + imageRelOffset.x;
		yOffset = subBoxOffset.y + imageRelOffset.y;
		GUI.DrawTexture(Rect(xOffset, yOffset, imgSize.x, imgSize.y), weaponImage, ScaleMode.ScaleToFit, true, imgAspectRatio);
		xOffset = subBoxOffset2.x + imageRelOffset.x;
		yOffset = subBoxOffset.y + imageRelOffset.y;
		GUI.DrawTexture(Rect(xOffset, yOffset, imgSize.x, imgSize.y), weaponImage, ScaleMode.ScaleToFit, true, imgAspectRatio);
	}
	
	var acceptButtonOffset = Vector2(backgroundBoxOffset.x, (backgroundBoxOffset.y+backgroundBoxSize.y)-optionButtonsSize.y);
	if (GUI.Button(Rect(acceptButtonOffset.x, acceptButtonOffset.y, optionButtonsSize.x, optionButtonsSize.y), "Pick up")) {
		newWeapon.SwapPlayersWeapon();
		interactionController.activePickup = false;
		if (interactionController.disabledMaterial)
			renderer.material = interactionController.disabledMaterial;
			
		// Send a log message
		var logger : PCGGenericLogger = (GameObject.FindWithTag("MapManager")).GetComponent(PCGGenericLogger);
		if (logger == null)
			Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
		else {
			logger.AddEntry("...... examined Weapon");
			logger.AddEntry("......... pickedup Weapon");
			if (!newWeapon.weaponExamined) {
				logger.IncrementFeatureStat(FEATURES.Weapon);
				newWeapon.weaponExamined = true;
			}
			logger.WeaponPickedup();
		}
			
		Time.timeScale = 1;
		enabled = false;
	}
	
	var cancelButtonOffset = Vector2((backgroundBoxOffset.x+backgroundBoxSize.x)-optionButtonsSize.x, (backgroundBoxOffset.y+backgroundBoxSize.y)-optionButtonsSize.y);
	if (GUI.Button(Rect(cancelButtonOffset.x, cancelButtonOffset.y, optionButtonsSize.x, optionButtonsSize.y), "Cancel")) {
		// Send a log message
		logger = (GameObject.FindWithTag("MapManager")).GetComponent(PCGGenericLogger);
		if (logger == null)
			Debug.LogError("An instance of PCGGenericLogger was not found on a map manager");
		else {
			logger.AddEntry("...... examined Weapon");
			logger.AddEntry("......... refused Weapon");
			if (!newWeapon.weaponExamined) {
				logger.IncrementFeatureStat(FEATURES.Weapon);
				newWeapon.weaponExamined = true;
			}			
		}
		
		Time.timeScale = 1;
		enabled = false;
	}
}