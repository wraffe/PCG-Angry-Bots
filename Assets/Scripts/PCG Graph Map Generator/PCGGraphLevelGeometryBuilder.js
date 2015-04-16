#pragma strict

private var visitedNodes : Hashtable;
private var startTransform : Transform;

function BuildLevel (startNode : PCGGraphNode) {
	visitedNodes = new Hashtable();
	
	// Instantiate the starting node
	var startPrefab : Transform = startNode.GetRoomTemplate().transform;
	startTransform = (Instantiate(startPrefab, Vector3(0,0,0), Quaternion.identity)).transform; 
	startTransform.GetComponent(PCGDoorAnchors).InitAnchors();
	
	// Start building the geomerty
	RecursiveBuild(startNode, startTransform);	
}

private function RecursiveBuild (currentNode : PCGGraphNode, currentTransform : Transform) {
	var currentEdgeList : PCGGraphEdge[] = currentNode.GetEdgeList();
	
	// Use keys in hashtable to quickly identify if a node has been traversed in the recursive call
	visitedNodes.Add(currentNode.GetID(), null);	
	
	// Build links to connected edges, then recursively visit each child
	for (var i : int = 0; i < currentEdgeList.length; i++) {
		var edge = currentEdgeList[i];
		
		// The edge will be null if no corridor is connected 
		// e.g. room has 3 doors (edges) but only 2 are in use
		if (edge != null) {
			var childNode = edge.GetOtherNode(currentNode);
		
			// Only process the child if it hasn't already been visited 
			// *** Problem here if level is circular graph rather than tree
			// *** Will need a visited edge list as well
			if (!visitedNodes.ContainsKey(childNode.GetID())) {
				// Build corridor and connect it to the existing parent room
				var corridorPrefab : Transform = edge.GetCorridorTemplate().transform;
				var corridorTransform : Transform = (Instantiate(corridorPrefab, Vector3(0,0,0), Quaternion.identity)).transform;
				corridorTransform.GetComponent(PCGDoorAnchors).InitAnchors();
				ConnectAnchors(currentTransform, corridorTransform);
			
				// Build the child and connect it to the corridor
				var childPrefab : Transform = childNode.GetRoomTemplate().transform;
				var childTransform : Transform = (Instantiate(childPrefab, Vector3(0,0,0), Quaternion.identity)).transform;
				childTransform.GetComponent(PCGDoorAnchors).InitAnchors();
				ConnectAnchors(corridorTransform, childTransform);	
			
				// Move to next node and build children
				RecursiveBuild(childNode, childTransform);								
			}
		}
	}
}


function ConnectAnchors (room1 : Transform, room2 : Transform) {
	// Move room two to line up with room1's door
	// z-axis of door anchor always points at exit	
	var room1Anchors = room1.GetComponent(PCGDoorAnchors);
	var room2Anchors = room2.GetComponent(PCGDoorAnchors);
	
	var room1Door = room1Anchors.RandomFreeDoor();
	var room2Door = room2Anchors.RandomFreeDoor();
	
	// In order to make the room a child of the anchor (so that it move with the anchor)
	// we must first stop the anchor from being a child of the room
	room2Door.parent = null;
	room2.parent = room2Door;
	room2Door.position = room1Door.position;
	room2Door.Translate(room1Door.forward*5, Space.World);
	room2Door.LookAt(room1Door);
	room2Door.position = room1Door.position;		
	
	// Re-instate original parent-child relationship
	room2.parent = null;
	room2Door.parent = room2;
}


function PlacePlayer(playerTransform : Transform) {
	var playerSpawn = startTransform.GetComponent(PCGPlayerSpawn);
	
	// Get the spawn point transform
	if (!playerSpawn)
		Debug.LogError("Player prefab trying to be placed in a room without a PCGPlayerSpawn component");
	else 		
		playerTransform.position = playerSpawn.playerSpawnPoint.position;				
}