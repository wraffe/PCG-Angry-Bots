#pragma strict

private var mapManager : PCGTreeNEATMapManager;
private var logger : PCGGenericLogger;

function Awake () {
	mapManager = GameObject.FindGameObjectWithTag("MapManager").GetComponent(PCGTreeNEATMapManager);
	
	logger = (GameObject.FindWithTag("MapManager")).GetComponent(PCGGenericLogger);
	if (logger == null)
		Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
}


function InteractWithPlayer () {
	if (logger != null) {
		logger.AddEntry("reached Exit");
		logger.MapCompleted();
	}
	mapManager.gameState = PCG_STATE.RateMap;
}