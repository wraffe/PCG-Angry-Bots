
#pragma strict

public var triggerTag : String = "Player";
public var puzzle : PCGPuzzle;
public var enterSignals : SignalSender;
public var exitSignals : SignalSender;

private var roomEntered : boolean;


function Awake() {
	roomEntered = false;
}

function OnTriggerEnter (other : Collider) {
	if (other.isTrigger)
		return;
	
	if (other.gameObject.tag == triggerTag || triggerTag == "") {
		if (!puzzle.puzzleLocked && !puzzle.permaLocked)
			enterSignals.SendSignals (this);
			
		// Doors always have their local orientation facing inwards to the room along the z-axis
		// Thus, we can tell if the player is entering or exiting the room
		// Test the corridor side of the collider for both entering an exiting events
		var playerRelativeToDoor : Vector3 = transform.InverseTransformPoint(other.transform.position);
		if (playerRelativeToDoor.z < 0) {
		 	// Send a log message
			var logger : PCGGenericLogger = (GameObject.FindWithTag("MapManager")).GetComponent(PCGGenericLogger);
			if (logger == null)
				Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
			else {
				logger.AddEntry("... exited Corridor");
				logger.AddEntry("... entered Room (" + puzzle.treeDepth + "," + puzzle.treeSibling + ") through Door " + puzzle.doorID);
				if (!puzzle.roomVisited) {
					puzzle.roomVisited = true;
					logger.RoomVisited();
				}
			}
		 }
	}
}

function OnTriggerExit (other : Collider) {
	if (other.isTrigger)
		return;
	
	if (other.gameObject.tag == triggerTag || triggerTag == "") {
		if (!puzzle.puzzleLocked && !puzzle.permaLocked)
			exitSignals.SendSignals (this);
		
		// Doors always have their local orientation facing inwards to the room along the z-axis
		// Thus, we can tell if the player is entering or exiting the room
		// Test the corridor side of the collider for both entering an exiting events
		var playerRelativeToDoor : Vector3 = transform.InverseTransformPoint(other.transform.position);
		if (playerRelativeToDoor.z < 0) {
		 			 	// Send a log message
			var logger : PCGGenericLogger = (GameObject.FindWithTag("MapManager")).GetComponent(PCGGenericLogger);
			if (logger == null)
				Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
			else {
				logger.AddEntry("... exited Room (" + puzzle.treeDepth + "," + puzzle.treeSibling + ") through Door " + puzzle.doorID);
				logger.AddEntry("... entered Corridor");
				if (!puzzle.roomVisited)
					puzzle.roomVisited = true;
			}
		}
	}
}

function ManualTriggerEnter () {
	if (!puzzle.puzzleLocked && !puzzle.permaLocked)
		enterSignals.SendSignals (this);
}