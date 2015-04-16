var activePickup : boolean = true;

var weaponSelectGUI : PCGWeaponBoxGUI;

var disabledMaterial : Material;

private var logger : PCGGenericLogger;

function Awake() {
	// Send a log message
	logger = (GameObject.FindWithTag("MapManager")).GetComponent(PCGGenericLogger);
	if (logger == null)
		Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
	else {
		logger.IncrementFeatureTotal(FEATURES.Weapon);
	}
}
		
function InteractWithPlayer () {
	if (activePickup) 
		weaponSelectGUI.enabled = true;	
}

function OnDestroy() {	
	if (logger == null)
		Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
	else {		
		logger.DecrementFeatureTotal(FEATURES.Weapon);
	}	
}

function OnApplicationQuit() {
	logger = null;
}