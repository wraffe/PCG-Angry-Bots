#pragma strict
@script RequireComponent(PCGLinearGeometryBuilder)

public var mu : int = 5; // num parents
public var lambda : int = 5; // num children
public var gamma : int = 10; // num generations between getting player feedback
public var sigma : int = 100; // mutation step size
public var pm : float = 0.5; // probability of mutation (i.e. mutation rate)
public var failureAllowance = 5; // For each child, try this many times through recombination.mutation before resorting to random generation

public var dummyRoom : PCGGenericRoomManager; // Used for debugging through TestFitnessEvaluation
public var totalGenerations : int; // Used for debuging, how many generations have passed
public var totalEvaluations : int;

@HideInInspector
public var X : List.<PCGLinearGene>[]; // Array of candidates. i.e. Population
@HideInInspector
public var R : float[]; // Array of predicted ratings

private var geometryBuilder : PCGLinearGeometryBuilder;
private var lastBest : int;

function Awake() {
	if (geometryBuilder == null)
		geometryBuilder = gameObject.GetComponent(PCGLinearGeometryBuilder);
	
	X = new List.<PCGLinearGene>[mu+lambda]; // Population size is numParents + numChildren
	R = new float[mu+lambda]; 
	lastBest = -99;
	totalGenerations = 0;
	totalEvaluations = 0;
}

function Evolve() {
	if (geometryBuilder == null)
		geometryBuilder = gameObject.GetComponent(PCGLinearGeometryBuilder);
		
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
				X[mu+n] = Recombination();
				Mutation(X[mu+n]);
			}
			else {
				Debug.Log("X["+(mu+n)+"] Resorted to random");
				X[mu+n] = RandomCandidate(X[0].Count); 
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


/* Cut and Splice recombination with equal probability for each gene to be cut.
 * Only one child is produced, the other is discarded. 
 */
function Recombination() : List.<PCGLinearGene>  {
	// First, select two parents
	var id1 : int = Random.Range(0,mu);
	var id2 : int = Random.Range(0,mu);
	while (id2 == id1)
		id2 = Random.Range(0,mu);
		
	var parent1 : List.<PCGLinearGene> = X[id1];
	var parent2 : List.<PCGLinearGene> = X[id2];
	
	/* Find a cut point for each parent. Must be at least after first room and at least before last
	 * Remember, first gene is only a corridor so don't count it.
	 * Cut is made before the selected gene for both parents */
	var cutPos1 : int = Random.Range(2,parent1.Count);
	var cutPos2 : int = Random.Range(2,parent2.Count);
	
	// Child is first part (before cut) of 1st parent and second part (after cut) of 2nd parent 
	var child : List.<PCGLinearGene> = new List.<PCGLinearGene>((cutPos1)+(parent2.Count-cutPos2));
	for (var i : int = 0; i < cutPos1; i++)
		child.Add(new PCGLinearGene(parent1[i]));
	for (i = cutPos2; i < parent2.Count; i++)
		child.Add(new PCGLinearGene(parent2[i]));	
	
	return child;
}

// Change values of 
function Mutation(candidate : List.<PCGLinearGene>) {
	var numRoomSettings : int = geometryBuilder.numRoomGeom * Mathf.Pow(PCGGenericRoomManager.numSettings, PCGGenericRoomManager.numFeatures);
	for (var i : int = 1; i < candidate.Count; i++) {
		// Based on the probability of mutation, will the roomID of this gene mutate
		if (Random.value <= pm) {  
			var step : int = Random.Range(-sigma, sigma+1);
			candidate[i].roomID = Mathf.Clamp(candidate[i].roomID+step, 0, numRoomSettings-1);
			
			// Re-assign doors
			var roomGeometry : int = PCGGenericRoomManager.FullIdToGeometryId(candidate[i].roomID);
			var numDoors : int = geometryBuilder.GetNumDoors(roomGeometry);	
			candidate[i].inDoor = Random.Range(0,numDoors);
			candidate[i].outDoor = Random.Range(0,numDoors); 
			while (candidate[i].outDoor == candidate[i].inDoor) 
				candidate[i].outDoor = Random.Range(0,numDoors); 
		}
		else {
			// If the room doesn't mutate, then try to mutate the doors and corridors
			roomGeometry = PCGGenericRoomManager.FullIdToGeometryId(candidate[i].roomID);
			numDoors = geometryBuilder.GetNumDoors(roomGeometry);
			
			// Inbound door
			if (Random.value <= pm) {
				candidate[i].inDoor = Random.Range(0,numDoors);
				while (candidate[i].outDoor == candidate[i].inDoor) 
					candidate[i].outDoor = Random.Range(0,numDoors);
			}
			// Outbound door
			if (Random.value <= pm) {
				candidate[i].outDoor = Random.Range(0,numDoors);
				while (candidate[i].outDoor == candidate[i].inDoor) 
					candidate[i].outDoor = Random.Range(0,numDoors);
			}
			// Corridor id
			if (Random.value <= pm) 
				candidate[i].corridorID = Random.Range(0,geometryBuilder.numCorrGeom);
		}	
	}
}

function ToClassifierRep(candidate : List.<PCGLinearGene>) : double[] {
	var fullID : int;
	var settingsID : int;
	var classifierRep : double[] = new double[PCGGenericRoomManager.numFeatures*PCGGenericRoomManager.numSettings];
	for (var i : int = 1; i < candidate.Count; i++) {
		fullID = candidate[i].roomID;
		settingsID = PCGGenericRoomManager.FullIdToSettingsId(fullID);
		dummyRoom.IdToSettings(settingsID);
		
		var roomVals = dummyRoom.SettingsToClassifierData();
		for (var j : int = 0; j < roomVals.Length; j++)
			classifierRep[j] += roomVals[j];		
	}
	
	return classifierRep;
}


/* Used to test whether the evolutionary algorithm is converging or not.
 * Favors lots of pickups and no enemies */
function TestingFitnessEvaluation(candidate : List.<PCGLinearGene>) : float {
	var fullID : int;
	var settingsID : int;
	var fitness : int = 0;
	
	var converged : boolean = true;
	
	// Loop through the rooms in the candidate to get 
	for (var i : int = 1; i < candidate.Count; i++) {
		fullID = candidate[i].roomID;
		settingsID = PCGGenericRoomManager.FullIdToSettingsId(fullID);
		dummyRoom.IdToSettings(settingsID);
		
		// Fitness is sum of all settings of each room in the map. 
		// Positive score for each pick-up, negative score for each enemy
		fitness = fitness + parseInt(dummyRoom.featureSettings[FEATURES.Ammo]) + parseInt(dummyRoom.featureSettings[FEATURES.Health])
						  + parseInt(dummyRoom.featureSettings[FEATURES.Weapon]) - parseInt(dummyRoom.featureSettings[FEATURES.Spider])
						  - (2*parseInt(dummyRoom.featureSettings[FEATURES.Buzz])) - (3*parseInt(dummyRoom.featureSettings[FEATURES.Mech])); 
		
		// Stop when a map with no enemies has been found				  
		if (dummyRoom.featureSettings[FEATURES.Spider] != SETTINGS.None
				|| dummyRoom.featureSettings[FEATURES.Buzz] != SETTINGS.None
				|| dummyRoom.featureSettings[FEATURES.Mech] != SETTINGS.None)
		{
			converged = false;				  
		} 
	}
	
	if (converged == true)
		fitness = 10000;
	
	totalEvaluations++;		
	return fitness;
}


function RandomCandidate(size : int) : List.<PCGLinearGene> {
	if (geometryBuilder == null)
		geometryBuilder = gameObject.GetComponent(PCGLinearGeometryBuilder);
		
	var candidate : List.<PCGLinearGene> = new List.<PCGLinearGene>(size+1);
	var numRoomSettings : int = Mathf.Pow(PCGGenericRoomManager.numSettings, PCGGenericRoomManager.numFeatures);
	var numRoomGeometries : int = geometryBuilder.numRoomGeom;
	var numCorridors : int = geometryBuilder.numCorrGeom;
	
	var zero : int = 0;
	
	// Loop once for each gene (i.e. each room) of the map
	// i=1 and size+1 because first element is starting corridor with no room template 
	//(connected to starting room instead)
	candidate.Add(new PCGLinearGene(0,0,0,Random.Range(0,numCorridors)));
	for (var i = 1; i < size+1; i++) {
		// Generate a room template ID number. Random.Range is inclusive of min but exlusive of max for ints
		var roomGeometry : int = Random.Range(0,numRoomGeometries);			 
		var roomTemplateID : int = PCGGenericRoomManager.GeometryAndSettingsToFullId(roomGeometry,Random.Range(zero,numRoomSettings)); 
		
		// choose the inbound and outbound doors
		var numDoors : int = geometryBuilder.GetNumDoors(roomGeometry);	
		var inDoor : int = Random.Range(0,numDoors);
		var outDoor : int = Random.Range(0,numDoors); 
		while (outDoor == inDoor) {
			outDoor = Random.Range(0,numDoors); 
		}
		
		// Choose the outbound corridor
		var corridorTemplateID : int = Random.Range(0,numCorridors);
		
		// Create a gene and add it to the array
		candidate.Add(new PCGLinearGene(inDoor,roomTemplateID,outDoor,corridorTemplateID)); 
	}
	
	return candidate;
}


/* Used for random initialization of first generation */
function RandomPopulation(candidateSize : int) {
	for (var j : int = 0; j < mu; j++) {
		X[j] = RandomCandidate(candidateSize);
		yield StartCoroutine(geometryBuilder.ValidateMap(X[j]));
		while (!geometryBuilder.validMap) {
			X[j] = RandomCandidate(candidateSize);
			yield StartCoroutine(geometryBuilder.ValidateMap(X[j]));
		}
		R[j] = TestingFitnessEvaluation(X[j]);
	}
}



/*** Utility Functions ****/
function QuickSortCandidates(left : int, right : int)
{
    var i : int = left;
    var j : int = right;
    var pivotIndex : int = Mathf.CeilToInt((left + right) / 2.0f);
    var pivotVal : float = R[pivotIndex];
    var tempCand : List.<PCGLinearGene>;
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

function CandidateToString(candidate : List.<PCGLinearGene>) : String {
	var description : String = "";
	for (var i : int = 0; i < candidate.Count; i++) {
		description = description + "->" + candidate[i].roomID;
	}
	return description;
}


