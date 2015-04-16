#pragma strict

var pauseGUI : PCGPauseGUI;

private var logger : PCGGenericLogger;

function Awake() {
	logger = (GameObject.FindWithTag("MapManager")).GetComponent(PCGGenericLogger);
	if (logger == null)
		Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
}

function Update () {
	// Unpausing done in gui
	if (Input.GetButtonDown("Pause")) {
		if (!pauseGUI.enabled) {
			pauseGUI.enabled = true;
			
			if (logger != null) {
				logger.AddEntry("paused");
			}
		}
	}
}