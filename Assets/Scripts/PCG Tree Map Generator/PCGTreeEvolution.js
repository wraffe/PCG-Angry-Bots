#pragma strict

@script RequireComponent(PCGTreeGeometryBuilder)

public var mu : int = 5; // num parents
public var lambda : int = 5; // num children
public var gamma : int = 10; // num generations between getting player feedback
public var sigma : int = 100; // mutation step size
public var mutationRate : float = 0.5; // Mutations change the tree structure (e.g. add/remove nodes)
public var failureAllowance = 5; // For each child, try this many times through recombination.mutation before resorting to random generation

public var totalGenerations : int; // Used for debuging, how many generations have passed
public var totalEvaluations : int;

@HideInInspector
public var X : PCGTreeCandidate[]; // Array of candidates. i.e. Population
@HideInInspector
public var R : float[]; // Array of predicted ratings

private var geometryBuilder : PCGTreeGeometryBuilder;
private var lastBest : int;

private var minDirectPathLength : int;
private var maxDirectPathLength : int;
private var candidateMaxNodes : int;
final static var randomizeFlag : int = -1;


function Awake() {
	if (geometryBuilder == null)
		geometryBuilder = gameObject.GetComponent(PCGTreeGeometryBuilder);
	
	X = new PCGTreeCandidate[mu+lambda]; // Population size is numParents + numChildren
	R = new float[mu+lambda]; 
	lastBest = -99;
	totalGenerations = 0;
	totalEvaluations = 0;
	
	var mapManager : PCGTreeMapManager = GameObject.Find("_TreeMapManager").GetComponent(PCGTreeMapManager);
	minDirectPathLength = mapManager.minNumDirectPathRooms;
	maxDirectPathLength = mapManager.maxNumDirectPathRooms;
	candidateMaxNodes = mapManager.maxNumRoomsPerCandidate;
}

/********* Main Evolution Loop ***************/
function Evolve() {
	if (geometryBuilder == null)
		geometryBuilder = gameObject.GetComponent(PCGTreeGeometryBuilder);
		
	if (X[mu-1] == null) {
		Debug.LogError("First generation of candidates has not been initialized!");
		return;	
	}
	
	var g : int = 0;  // generation counter
	while (g < gamma || R[0] <= lastBest) { // Keep going for a number of generation or until a better map is available
		var n : int = 0; // child counter
		var attempts : int = 0;
		while (n < lambda) {
			// Try to create a child through genetic operators
			if (attempts <= failureAllowance) {
				//X[mu+n] = Recombination();
				Mutation(X[mu+n]);
			}
			else {
				Debug.Log("X["+(mu+n)+"] Resorted to random");
				X[mu+n] = RandomCandidate(PCGTreeEvolution.randomizeFlag,X[0].branchingProbability, X[0].branchingDecay); 
			}
			
			yield StartCoroutine(geometryBuilder.ValidateMap(X[mu+n]));		
			if (geometryBuilder.validMap) {
				//R[mu+n] = p.PredictRating(ToClassifierRep(X[mu+n]));
				//R[mu+n] = 1;
				R[mu+n] = TestingFitnessEvaluation(X[mu+n]);
				Debug.Log("Candidate Rating = " + R[mu+n]);
				n++;
				attempts = 0;
			}
			else
				attempts++;
			
		}	
		
		QuickSortCandidates(0, mu+lambda-1);		
		g++;
		totalGenerations++;
	}	
	lastBest = R[0];
}



/**************** Evolutionary Operators ***************/

function Mutation(candidate : PCGTreeCandidate) {
	candidate.rootNode.RecursiveMutation(candidate, null, candidate.branchingProbability, mutationRate, minDirectPathLength, maxDirectPathLength);
}

function Recombination() : PCGTreeCandidate {	
	// First, select two parents
	var id1 : int = Random.Range(0,mu);
	var id2 : int = Random.Range(0,mu);
	while (id2 == id1)
		id2 = Random.Range(0,mu);
		
	var parent1 : PCGTreeCandidate = X[id1];
	var parent2 : PCGTreeCandidate = X[id2];	
	var position1 : int = Random.Range(0,parent1.directPathLength);
	var position2 : int = Random.Range(0,parent2.directPathLength);
	
	var parent2Node : PCGTreeNode = parent2.rootNode.GetDirectPathNode(position2,0);
	var newRoot : PCGTreeNode = new PCGTreeNode(parent1.rootNode);
	
	var newCandidate : PCGTreeCandidate = new PCGTreeCandidate(newRoot, candidateMaxNodes, parent1.branchingProbability, parent1.branchingDecay);
	newRoot.RecursiveRecombination(newCandidate, parent1.rootNode, parent2Node, position1);
	
	return newCandidate;
}


/*************** Fitness Evaluators **************/
function TestingFitnessEvaluation(candidate : PCGTreeCandidate) : float {
	totalEvaluations++;
	return candidate.rootNode.RecursiveDummyFitness(0);
}


/*************** Utilities ***************/

function RandomCandidate(size : int, branchProbability : float, branchDecay : float) : PCGTreeCandidate {
	if (geometryBuilder == null)
		geometryBuilder = gameObject.GetComponent(PCGTreeGeometryBuilder);
	
	if (size == PCGTreeEvolution.randomizeFlag) 
		size = Random.Range(minDirectPathLength, maxDirectPathLength+1);
	if (branchProbability == PCGTreeEvolution.randomizeFlag)	
		branchProbability = Random.value;
	if (branchDecay == PCGTreeEvolution.randomizeFlag)	
		branchDecay = Random.value;

	var currentNode : PCGTreeNode = new PCGTreeNode(0,0,0,0,false,geometryBuilder);
	var candidate : PCGTreeCandidate;
	var directPathNodes : PCGTreeNode[] = new PCGTreeNode[size];
	
	// Build direct path first of length size
	for (var i : int = 0; i <= size; i++) {
		// This is mostly same as a Linear Random map, but only with the inbound door; outbound doors handled by AddChild
		var newNode : PCGTreeNode = currentNode.RandomNewNode();
		newNode.directPath = true;
		
		// If this is the first node  of the tree
		if (i == 0) {
			candidate = new PCGTreeCandidate(newNode, candidateMaxNodes, branchProbability, branchDecay);
			directPathNodes[i] = newNode;
			candidate.directPathLength++;
			candidate.totalNodeCount++;
		}
		// If this is the last node, make it the exitNode (directPathSize doesnt count exitNode)
		else if (i == size) {
			newNode = new PCGTreeNode(0,PCGTreeNode.exitRoom, 0, Random.Range(0,geometryBuilder.numCorrGeom), true, geometryBuilder); 
			if (!currentNode.AddChild(newNode))
				Debug.LogWarning("Couldnt add exit room");
			// Do branching on node before the exit
			currentNode.RecursiveBranching(candidate, candidate.branchingProbability, candidate.branchingDecay);
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


/* Used for random initialization of first generation */
function RandomPopulation(candidateSize : int, branchProbability : float, branchDecay : float) {
	for (var j : int = 0; j < mu+lambda; j++) {
		X[j] = RandomCandidate(candidateSize, branchProbability, branchDecay);
		yield StartCoroutine(geometryBuilder.ValidateMap(X[j]));
		while (!geometryBuilder.validMap) {
			X[j] = RandomCandidate(candidateSize, branchProbability, branchDecay);
			yield StartCoroutine(geometryBuilder.ValidateMap(X[j]));
		}

		R[j] = TestingFitnessEvaluation(X[j]);
	}
}

	
function QuickSortCandidates(left : int, right : int)
{
    var i : int = left;
    var j : int = right;
    var pivotIndex : int = Mathf.CeilToInt((left + right) / 2.0f);
    var pivotVal : float = R[pivotIndex];
    var tempCand : PCGTreeCandidate;
    var tempRating : float;
    
    while (i <= j)
    {
        while (R[i] > pivotVal)
        {
            i++;
        }
        while (pivotVal > R[j])
        {
            j--;
        }
        if (i <= j)
        {
        	// Once an element on either side of the pivot has been found to swap
        	// swap them in both the Rating list and the Candidate list
            tempRating = R[i];
            R[i] = R[j];
            R[j] = tempRating;
            
            tempCand = X[i];
            X[i] = X[j];
            X[j] = tempCand;
            
            i++;
            j--;
        }
    }
    if (left < j)
    {
        QuickSortCandidates(left, j);
    }
    if (i < right)
    {
        QuickSortCandidates(i, right);
    }
}	
