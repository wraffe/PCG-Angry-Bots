var healthQuantity : float = 20;

var disabledMaterial : Material;

private var activePickup : boolean;

private var player : GameObject;
private var playerHealth : Health;

private var logger : PCGGenericLogger;

function Awake () {
	activePickup = true;
	player = GameObject.FindWithTag ("Player");
	playerHealth = player.GetComponent(Health);
	
	// Send a log message
	logger = (GameObject.FindWithTag("MapManager")).GetComponent(PCGGenericLogger);
	if (logger == null)
		Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
	else {
		logger.IncrementFeatureTotal(FEATURES.Health);
	}
}

function InteractWithPlayer () {
	if (activePickup) {
		if (audio)
			audio.Play();
			
		playerHealth.health += healthQuantity;
		if (playerHealth.health > playerHealth.maxHealth)
			playerHealth.health = playerHealth.maxHealth;
			
			
		activePickup = false;
		
		// Send a log message
		if (logger == null)
			Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
		else {
			logger.AddEntry("...... pickedup Health");
			logger.IncrementFeatureStat(FEATURES.Health);
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
		logger.DecrementFeatureTotal(FEATURES.Health);
	}	
}

function OnApplicationQuit() {
	logger = null;
}	