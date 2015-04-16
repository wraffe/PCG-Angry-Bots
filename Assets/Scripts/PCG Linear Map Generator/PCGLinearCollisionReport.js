#pragma strict

var roomManager : PCGGenericRoomManager;

// Used during validation of map (i.e. no overlapping seggments)
// Pass the message back up the call stack
function OnTriggerEnter(hit : Collider) {	
	if (roomManager.geometryBuilder.mapChecked == false) 
		roomManager.geometryBuilder.mapChecked = true;
	if (hit.transform.parent != transform.parent){
		if (roomManager.geometryBuilder.validMap == true) {
			roomManager.geometryBuilder.validMap = false;
			//Debug.LogWarning("Boundary Collision");
		}
	}
}
