#pragma strict
enum BUILDAID_MODE {Build, Play}

var mode : BUILDAID_MODE;

/* How many maps to save to file. 
 * Build Mode will keep running until it has found and saved this many valid maps. 
 */
var numRecordedMaps : int;

/* Each map has one starting node (room) and one end node (room).
 * directPathLength is the number of nodes on the path that leads directly 
 * from the start node to the end node 
 */
var directPathLength : int;

/* This is the directPathLength plus all branching nodes (i.e. nodes that 
 * are not on the direct path). This value must be equal to or larger than directPathLength
 * Build Mode will first construct the Dirct Path, then keep adding Branching Nodes until
 * totalNodeCount is reached and then it will stop. 
 */
var totalNodeCount : int;

/* Controls how branches are spawned. branchProbability is the chance of a branch being created
 * for at each door of a room. Branch decay reduces the probability the further down a branch we go
 * e.g. a decay of 0.5 means that the second node in a branching path will have 50% less chance of 
 * having branches then the node before it.
 *
 * A high Probability and low Decay should result in deep (long) branching paths. 
 * A high Decay should result in shallow (short) branching paths
 */
var branchProbability : float;
var branchDecay : float;

@HideInInspector
var geometryBuilder : PCGTreeGeometryBuilder;
@HideInInspector
var loadingGui : PCGLoadingGUI;

function Start() {
	geometryBuilder = gameObject.GetComponent(PCGTreeGeometryBuilder);
	loadingGui = gameObject.GetComponent(PCGLoadingGUI);
	
	if (branchProbability < 0 || branchProbability > 1) {
		Debug.LogError("branchProbability must be between 0-1");
		return;
	}
	if (branchDecay < 0.1 || branchDecay > 0.9) {
		Debug.LogError("branchDecay must be between 0.1-0.9");
		return;
	}
	if (directPathLength > totalNodeCount)  {
		Debug.LogError("directPathLength must be less than totalNodeCount");
		return;
	}
	
	if (mode == BUILDAID_MODE.Build) {
		loadingGui.enabled = true;
		loadingGui.loadMessage = "Creating Maps";
		StartCoroutine(BuildMaps());	
	}
	else if (mode == BUILDAID_MODE.Play) {
		
	}
}


function BuildMaps() {
	var mapIndex : int = 0;
	var attempts : int = 0;
	Debug.Log("*****Attempting to Build map: " + mapIndex + "********"); 
	while (mapIndex < numRecordedMaps) {
		yield;
		yield;
		yield;
		var map : PCGTreeCandidate = RandomMap();		
		if (map.totalNodeCount >= map.maxNodeCount-2) {
			yield StartCoroutine(geometryBuilder.ValidateMap(map));			
			if (geometryBuilder.validMap) {
				Debug.Log("---> Valid map found after " + attempts + " attempts.");						
				var mapString = MapToString(map);
				var filePath = "Assets/MapFiles/map"+mapIndex+".txt";
				Debug.Log("---> Writing to file	" + filePath);
				System.IO.File.WriteAllText(filePath,mapString);
				mapIndex++;
				if (mapIndex < numRecordedMaps)
					Debug.Log("*****Attempting to Build Map: " + mapIndex + "********"); 		
			}
			else
				attempts++;
		}
		else
			attempts++;		
	} 
	loadingGui.loadMessage = "DONE!";
}


function RandomMap() : PCGTreeCandidate {
	var currentNode : PCGTreeNode = new PCGTreeNode(0,0,0,0,false,geometryBuilder);
	var candidate : PCGTreeCandidate;
	var directPathNodes : PCGTreeNode[] = new PCGTreeNode[directPathLength];
	
	// Build direct path first of length size
	for (var i : int = 0; i <= directPathLength; i++) {
		// This is mostly same as a Linear Random map, but only with the inbound door; outbound doors handled by AddChild
		var newNode : PCGTreeNode = currentNode.RandomNewNode();
		newNode.directPath = true;
		
		// If this is the first node  of the tree
		if (i == 0) {
			candidate = new PCGTreeCandidate(newNode, totalNodeCount, branchProbability, branchDecay);
			directPathNodes[i] = newNode;
			candidate.directPathLength++;
			candidate.totalNodeCount++;
		}
		// If this is the last node, make it the exitNode (directPathSize doesnt count exitNode)
		else if (i == directPathLength) {
			newNode = new PCGTreeNode(0,PCGTreeNode.exitRoom, 0, Random.Range(0,geometryBuilder.numCorrGeom), true, geometryBuilder); 
			if (!currentNode.AddChild(newNode))
				Debug.LogWarning("Couldnt add exit room");
		}
		// For every other node			
		else {
			// Add the new node to the direct path
			currentNode.AddChild(newNode);
			directPathNodes[i] = newNode;			
			candidate.directPathLength++;
			candidate.totalNodeCount++;			
		}			
		currentNode = newNode;			
	} 
	
	// Loop through again and do branching. Will stop if max number of nodes reached
	for (i = 0; i < candidate.directPathLength; i++) {
		directPathNodes[i].RecursiveBranching(candidate, candidate.branchingProbability, candidate.branchingDecay);
	}
	
	// Now finally, do rampant mutation until max nodes is reached. 
	// But put a limit on the attempts because if there are no free doors to mutate then it will be an infinite loop
	var mutateAttempts : int = 0;
	while (candidate.totalNodeCount < candidate.maxNodeCount && mutateAttempts < 20) {
		mutateAttempts++;
		candidate.rootNode.RecursiveRampantMutation(candidate, null, branchProbability, 0.8);
	}
	
	return candidate;
}	


function MapToString(map : PCGTreeCandidate) : String {
	var stringList : List.<String> = new List.<String>();
	map.rootNode.RecursiveOriginalTreeToStringList(stringList, -1, -1);
	
	var fullString : String = "";
	for (var i : int = 0; i < stringList.Count; i++) {
		if (i > 0) 
			fullString = fullString + '\n';
		fullString = fullString + stringList[i];
	}
	
	return fullString;
}





