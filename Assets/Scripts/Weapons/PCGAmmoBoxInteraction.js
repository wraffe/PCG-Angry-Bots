var ammoQty : int = 30;

var disabledMaterial : Material;

private var activePickup : boolean;

private var player : GameObject;
private var playerAmmo : PCGPlayerAmmo;

private var logger : PCGGenericLogger;

function Awake () {
	activePickup = true;
	player = GameObject.FindWithTag ("Player");
	playerAmmo = player.GetComponentInChildren(PCGPlayerAmmo);
	
	// Send a log message
	logger = (GameObject.FindWithTag("MapManager")).GetComponent(PCGGenericLogger);
	if (logger == null)
		Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
	else {
		logger.IncrementFeatureTotal(FEATURES.Ammo);
	}
}

function InteractWithPlayer () {
	if (activePickup) {
		if (audio)
			audio.Play();
		playerAmmo.AddAmmo(ammoQty);
		activePickup = false;
		
		// Send a log message
		if (logger == null)
			Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
		else {
			logger.AddEntry("...... pickedup Ammo");
			logger.IncrementFeatureStat(FEATURES.Ammo);
		}
		
		if (disabledMaterial)
			renderer.material = disabledMaterial;
		else
			Debug.Error("Missing a disabled material for ammo box");
	}
}

function OnDestroy() {	
	if (logger == null)
		Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
	else {		
		logger.DecrementFeatureTotal(FEATURES.Ammo);
	}	
}

function OnApplicationQuit() {
	logger = null;
}