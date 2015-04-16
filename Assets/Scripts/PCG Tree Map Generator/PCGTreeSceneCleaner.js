#pragma strict

var objectsToKeep : GameObject[];

function CleanUp() {
	var allObjects = GameObject.FindObjectsOfType(GameObject);
	
	for (var item in allObjects) {
		if ((item as GameObject).name == "spiderScorchMark"  || (item as GameObject).name == "mechScorchMark" ) 
			Destroy(item);				
	}
}