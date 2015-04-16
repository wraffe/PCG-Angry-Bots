#pragma strict

var room1 : Transform;
var room2 : Transform;

private var room1Anchors : PCGDoorAnchors;
private var room2Anchors : PCGDoorAnchors;

private var room1Door : Transform;
private var room2Door : Transform;

function Awake () {
	// Move room two to line up with room1's door
	// z-axis of door anchor always points at exit	
	room1Anchors = room1.GetComponent(PCGDoorAnchors);
	room2Anchors = room2.GetComponent(PCGDoorAnchors);
	
	room1Anchors.InitAnchors();
	room2Anchors.InitAnchors();
	
	room1Door = room1Anchors.RandomFreeDoor();
	room2Door = room2Anchors.RandomFreeDoor();
	
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


