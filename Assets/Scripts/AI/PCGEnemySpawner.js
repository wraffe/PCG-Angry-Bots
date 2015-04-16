
var enemyPrefab : GameObject;

private var logger : PCGGenericLogger;

// Start is called after all Awake function on all objects.
// Enemy instantiation needs to be done AFTER level geometry has been created and positioned
// This stops strange errors such as animations not playing
// Only really needed for Spiders
function Start() { 
	var enemyClone : GameObject = GameObject.Instantiate(enemyPrefab, transform.position, transform.rotation);
	enemyClone.tag = "ToDestroy";
}

function Awake() {
	// Send a log message
	logger = (GameObject.FindWithTag("MapManager")).GetComponent(PCGGenericLogger);
	if (logger == null)
		Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
	else {
		logger.IncrementFeatureTotal(FEATURES.Spider);
	}
}

function OnDrawGizmos () {
    Gizmos.DrawIcon (transform.position, "patrol.tif", true);
}

function OnDestroy() {	
	if (logger == null)
		Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
	else {		
		logger.DecrementFeatureTotal(FEATURES.Spider);
	}	
}

function OnApplicationQuit() {
	logger = null;
}