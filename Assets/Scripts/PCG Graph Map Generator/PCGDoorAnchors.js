#pragma strict

public var doorAnchors : Transform[];

private var freeDoors : Array;

function InitAnchors () {
	freeDoors = new Array(doorAnchors);	
}

function RandomFreeDoor () : Transform {
	if (freeDoors.length == 0)
		return null;
	var randIndex : int = Random.Range(0, freeDoors.length);
	var doorAnchor : Transform = freeDoors[randIndex] as Transform;
	freeDoors.RemoveAt(randIndex);
	return doorAnchor;
}