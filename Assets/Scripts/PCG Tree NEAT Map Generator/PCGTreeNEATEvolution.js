#pragma strict

@script RequireComponent(PCGTreeGeometryBuilder)

public var geomPopSize = 8;
public var minMutationRate : float = 0.5; // Mutations change the tree structure (e.g. add/remove nodes)
public var failureAllowance = 5; // For each child, try this many times through recombination.mutation before resorting to random generation

@HideInInspector
public var mapManager : PCGTreeNEATMapManager;
@HideInInspector
public var geomPop : PCGTreeNEATCandidate[]; // Array of candidates. i.e. Population
@HideInInspector
public var contentEA : PCGNeatEA;

private var geometryBuilder : PCGTreeGeometryBuilder;
@HideInInspector
var mapToBuild : PCGTreeNEATCandidate;

private var minDirectPathLength : int;
private var maxDirectPathLength : int;
//private var candidateMaxNodes : int;
final static var randomizeFlag : int = -1;


function Awake() {
	if (geometryBuilder == null)
		geometryBuilder = gameObject.GetComponent(PCGTreeGeometryBuilder);	
	
	geomPop = new PCGTreeNEATCandidate[geomPopSize]; 
	contentEA = new PCGNeatEA();	
	
	mapManager = GameObject.Find("_TreeNEATMapManager").GetComponent(PCGTreeNEATMapManager);
	minDirectPathLength = mapManager.minNumDirectPathRooms;
	maxDirectPathLength = mapManager.maxNumDirectPathRooms;
}

/********* Main Evolutionary Methods***************/
function EvolveGeometry(playerSelection : int) {
	// Mandatory yield for a Coroutine
	yield;
	
	if (geometryBuilder == null)
		geometryBuilder = gameObject.GetComponent(PCGTreeGeometryBuilder);
		
	if (geomPop[0] == null) {
		Debug.LogError("First generation of candidates has not been initialized!");
		return;	
	}	
	
	yield StartCoroutine(GeometryMutation(playerSelection));
	
	Debug.Log("Mutation_Add: " + (geomPop[0].rootNode as PCGTreeNEATNode).mutationCounts[0]);
	Debug.Log("Mutation_Remove: " + (geomPop[0].rootNode as PCGTreeNEATNode).mutationCounts[1]);
	Debug.Log("Mutation_Permutation: " + (geomPop[0].rootNode as PCGTreeNEATNode).mutationCounts[2]);
	//for (var i : int =0; i < geomPop.Length; i++) 
		//Debug.Log("GeomPop["+i+"]: directPathLength = "+geomPop[i].directPathLength+", branchRate = "+geomPop[i].branchingProbability+", branchDecay = "+geomPop[i].branchingDecay);
	mapManager.gameState = PCG_STATE.SelectMap;
}


function EvolveContent(selectedGeometry : int, playerModel : PCGWekaClassifier) {
	if (!contentEA.IsInitialized())
		contentEA.Initialize();
	
	yield;
	yield;		
	var maxDepth : int = (geomPop[selectedGeometry].rootNode as PCGTreeNEATNode).RecursiveFindMaxDepth(0);
	var nodeList : List.<PCGNeatNodeData> = new List.<PCGNeatNodeData>();
	(geomPop[selectedGeometry].rootNode as PCGTreeNEATNode).RecursiveJtoCTreeConversion(nodeList,null,0,0,maxDepth,PCGGenericRoomManager.maxDoors-1);
	
	yield;
	yield;
	var startTime : double = Time.realtimeSinceStartup;	
	contentEA.RunEA(nodeList, playerModel);
	Debug.Log('Content Evolution Time: ' +(Time.realtimeSinceStartup-startTime));	
	
	yield;	
	contentEA.PrintStats();
	mapManager.gameState = PCG_STATE.PlayMap;
}

/**************** Evolutionary Operators ***************/

function GeometryMutation(selectedGeometry : int) {	
	geomPop[0] = geomPop[selectedGeometry];
	Debug.Log("Total Node Count of parent before count: " + geomPop[0].totalNodeCount);
	
	// Calculate inverse mutation rate, that is, the morenodes, the lower the chance of mutation
	var counter : PCGTreeCounterHelper = new PCGTreeCounterHelper();
	geomPop[0].rootNode.RecursiveCountTotalNodes(counter);
	geomPop[0].totalNodeCount = counter.count;

	var mutationRateRange : float = 1-minMutationRate;
	// E.g For 2 nodes in the parent, and a minMutationRate of 0.6...
	// 1-((2/10)*0.4) = 0.92. For 3 Nodes, 1-((3/10)*0.4) = 0.86 
	var inverseMutationRate : float = 1-((geomPop[0].totalNodeCount/10)*mutationRateRange);
	// And if there are more than 10 rooms...
	if (inverseMutationRate < minMutationRate)
		inverseMutationRate = minMutationRate;
	
	for (var i : int = 1; i < geomPopSize; i++) {
		//Debug.Log("MUTATION " + i);
		// Copy the player selected geometry and then mutate it for all other candidates
		var newCandidate : PCGTreeNEATCandidate = new PCGTreeNEATCandidate(geomPop[0]);
		(newCandidate.rootNode as PCGTreeNEATNode).RecursiveFixedTreeMutation(newCandidate, null, newCandidate.branchingProbability, inverseMutationRate, minDirectPathLength, maxDirectPathLength);
		
		// Test the new candidate and re-mutate if its invalid
		var invalidCount : int = 0;
		yield StartCoroutine(geometryBuilder.ValidateMap(newCandidate));
		while (!geometryBuilder.validMap) {
			invalidCount++;
			if (invalidCount < failureAllowance) {
				newCandidate = new PCGTreeNEATCandidate(geomPop[0]);
				(newCandidate.rootNode as PCGTreeNEATNode).RecursiveFixedTreeMutation(newCandidate, null, newCandidate.branchingProbability, inverseMutationRate, minDirectPathLength, maxDirectPathLength);
			}
			else {
				newCandidate = RandomCandidate(PCGTreeNEATEvolution.randomizeFlag, PCGTreeNEATEvolution.randomizeFlag, PCGTreeNEATEvolution.randomizeFlag);
			}	
			yield StartCoroutine(geometryBuilder.ValidateMap(newCandidate));
		}
		
		geomPop[i] = newCandidate;
		counter.count = 0;
		geomPop[i].rootNode.RecursiveCountTotalNodes(counter);
		geomPop[i].totalNodeCount = counter.count;
		Debug.Log("Mutation child " + i + " node count: " + geomPop[i].totalNodeCount);
	}
}

/* No recombination for geometry, just mutation of one parent */


/*************** Utilities ***************/

function RandomCandidate(size : int, branchProbability : float, branchDecay : float) : PCGTreeNEATCandidate {
	if (geometryBuilder == null)
		geometryBuilder = gameObject.GetComponent(PCGTreeGeometryBuilder);
	
	if (size == PCGTreeNEATEvolution.randomizeFlag) 
		size = Random.Range(minDirectPathLength, maxDirectPathLength+1);
	if (branchProbability == PCGTreeNEATEvolution.randomizeFlag)	
		branchProbability = Random.value;
	if (branchDecay == PCGTreeNEATEvolution.randomizeFlag)	
		branchDecay = Random.value;
	if (branchDecay < 0.1)
		branchDecay = 0.1; //Make sure there is actually a decay
		

	var currentNode : PCGTreeNEATNode = new PCGTreeNEATNode(0,0,0,0,false,geometryBuilder,0);
	var candidate : PCGTreeNEATCandidate;
	var directPathNodes : PCGTreeNEATNode[] = new PCGTreeNEATNode[size];
	
	// Build direct path first of length size
	for (var i : int = 0; i <= size; i++) {
		// This is mostly same as a Linear Random map, but only with the inbound door; outbound doors handled by AddChild
		var newNode : PCGTreeNEATNode;
		if (i==0)
			newNode = currentNode.RandomNewNEATNode(currentNode,true) as PCGTreeNEATNode;
		else
			newNode = currentNode.RandomNewNEATNode(currentNode,false) as PCGTreeNEATNode;
		newNode.directPath = true;
		
		// If this is the first node  of the tree
		if (i == 0) {
			candidate = new PCGTreeNEATCandidate(newNode, branchProbability, branchDecay);
			directPathNodes[i] = newNode;
			candidate.directPathLength++;
			candidate.totalNodeCount++;
		}
		// If this is the last node, make it the exitNode (directPathSize doesnt count exitNode)
		else if (i == size) {
			if (geometryBuilder.randomSibIndex)
				newNode = new PCGTreeNEATNode(0,PCGTreeNode.exitRoom, 0, Random.Range(0,geometryBuilder.numCorrGeom), true, geometryBuilder,currentNode.RandomFreeChildSiblingIndex(false)); 
			else
				newNode = new PCGTreeNEATNode(0,PCGTreeNode.exitRoom, 0, Random.Range(0,geometryBuilder.numCorrGeom), true, geometryBuilder,currentNode.FirstFreeChildSiblingIndex()); 
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
	
	return candidate;
}	


/* Used for testing random generation of fixed size maps */ 
/*function RandomFixedSizeCandidate(entireSize : int): PCGTreeNEATCandidate {
	if (geometryBuilder == null)
		geometryBuilder = gameObject.GetComponent(PCGTreeGeometryBuilder);
	
	size = Random.Range(2, entireSize);	
	branchProbability = Random.value;
	branchDecay = Random.value;
	if (branchDecay < 0.1)
		branchDecay = 0.1; 	
	
}*/


/* Used for random initialization of first generation */
function RandomGeomPopulation(candidateSize : int, branchProbability : float, branchDecay : float, dontPlay : boolean) {	
	for (var j : int = 0; j < geomPopSize; j++) {		
		geomPop[j] = RandomCandidate(candidateSize, branchProbability, branchDecay);
		yield StartCoroutine(geometryBuilder.ValidateMap(geomPop[j]));
		while (!geometryBuilder.validMap) {
			geomPop[j] = RandomCandidate(candidateSize, branchProbability, branchDecay);
			yield StartCoroutine(geometryBuilder.ValidateMap(geomPop[j]));
		}
		Debug.Log("Randomly Built Map: " + j + ", Total Node Count: " + geomPop[j].totalNodeCount);
	}
	
	//for (var i : int =0; i < geomPop.Length; i++) 
		//Debug.Log("MinDirectPath = " + minDirectPathLength + ", GeomPop["+i+"].directPathLength = "+geomPop[i].directPathLength);
	if (!dontPlay)
		mapManager.gameState = PCG_STATE.SelectMap;
}


function SetContentAndBuild(selectedGeometry : int, buildMode : PCG_METHOD, logger : PCGGenericLogger) {
	// Just make sure there is no map before hand, good for Restarting same map
	geometryBuilder.DestroyLastMap();
	
	mapToBuild = geomPop[selectedGeometry];
	if (buildMode == PCG_METHOD.Optimize) {
		Debug.Log("STATE: Apply Evolved Content");
		var maxDepth : int = (mapToBuild.rootNode as PCGTreeNEATNode).RecursiveFindMaxDepth(0);
		(mapToBuild.rootNode as PCGTreeNEATNode).RecursiveCPPNContentCalculator(contentEA,0,0,maxDepth, PCGGenericRoomManager.maxDoors-1);
	}
	else if (buildMode == PCG_METHOD.Randomize) {
		Debug.Log("STATE: Random Geometry and Content by User Choice");
		mapToBuild = RandomCandidate(PCGTreeNEATEvolution.randomizeFlag,PCGTreeNEATEvolution.randomizeFlag,PCGTreeNEATEvolution.randomizeFlag);
		yield StartCoroutine(geometryBuilder.ValidateMap(mapToBuild));
		while (!geometryBuilder.validMap) {
			mapToBuild = RandomCandidate(PCGTreeNEATEvolution.randomizeFlag,PCGTreeNEATEvolution.randomizeFlag,PCGTreeNEATEvolution.randomizeFlag);
			yield StartCoroutine(geometryBuilder.ValidateMap(mapToBuild));
		}
		(mapToBuild.rootNode as PCGTreeNEATNode).RecursiveRandomContentSettings();
	}
	else if (buildMode == PCG_METHOD.Defined)
		Debug.Log("STATE: Defined Geometry (most likely from archives) is being built");
	
	var counter : PCGTreeCounterHelper = new PCGTreeCounterHelper();
	mapToBuild.rootNode.RecursiveCountTotalNodes(counter);
	mapToBuild.totalNodeCount = counter.count;
	logger.SetRoomsTotal(mapToBuild.totalNodeCount);
	geometryBuilder.BuildMap(mapToBuild);
	mapManager.gameState = PCG_STATE.AwaitingPlayer;
}

/******* File Writing Tools **********/
function CandidateToString(selectedGeometry : PCGTreeNEATCandidate, maxDepth : String) : String {
	
	var stringList : List.<String> = new List.<String>();
	(selectedGeometry.rootNode as PCGTreeNEATNode).RecursiveTreeToStringList(stringList, -1, -1);
	
	var fullString : String = '';
	for (var i : int = 0; i < stringList.Count; i++) {
		if (i > 0) 
			fullString = fullString + '\n';
		fullString = fullString + stringList[i];
	}
	
	if (maxDepth.Equals(''))
		fullString = fullString + '\n' + selectedGeometry.branchingProbability + ',' + selectedGeometry.branchingDecay;
	else {
		Debug.Log('Max Depth = '+maxDepth);
		fullString = maxDepth + '\n' + fullString + '\n' + selectedGeometry.branchingProbability + ',' + selectedGeometry.branchingDecay;
	}	
	return fullString;
}


function StringToCandidate(fullString : String) : PCGTreeNEATCandidate {	
	// Read the full string into a list of strings
	var stringArray : String[] = fullString.Split('\n'[0]);
	
	// Create a list of nodes, making each string into a node
	var nodeList : List.<PCGTreeNEATNode> = new List.<PCGTreeNEATNode>();
	for (var nodeString : String in stringArray) {
		// If its has picked up a blank line at the end of the file, ignore it
		if (nodeString.Equals(""))
			break;
			
		var nodeData : String[] = nodeString.Split(','[0]);
		var branchRate = Random.value;
		var branchDecay = Random.value;
		// If there are only two items on the line, this is the branch rate and decay, not node data
		if (nodeData.Length == 2) {
			branchRate = parseFloat(nodeData[0]);
			branchDecay = parseFloat(nodeData[1]);
		}
		else {
			var contentId = parseInt(nodeData[0]);
			var geomId = parseInt(nodeData[1]);
			var inboudDoor = parseInt(nodeData[2]);
			var inbounCorridor = parseInt(nodeData[3]);
			var directPath = boolean.Parse(nodeData[4]);
			var fixedIndex = parseInt(nodeData[5]);
			
			var newNode : PCGTreeNEATNode = new PCGTreeNEATNode(contentId,geomId,inboudDoor,inbounCorridor,directPath,geometryBuilder,fixedIndex);
			nodeList.Add(newNode);
			
			// Attach each new node to it's parent
			var parentIndex = parseInt(nodeData[6]);
			var parentDoorId = parseInt(nodeData[7]);
			if(parentIndex >= 0)
				nodeList[parentIndex].AddChildAtDoor(parentDoorId,newNode);
		}
	}
	
	// Create a candidate from the list with random branching rate and decay
	var newCandidate = new PCGTreeNEATCandidate(nodeList[0],branchRate,branchDecay);
	newCandidate.directPathLength = newCandidate.rootNode.RecursiveCountDirectPath();
	var counter : PCGTreeCounterHelper = new PCGTreeCounterHelper();
	newCandidate.rootNode.RecursiveCountTotalNodes(counter);
	newCandidate.totalNodeCount = counter.count;
	return (newCandidate);
}
