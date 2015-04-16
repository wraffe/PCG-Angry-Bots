#pragma strict

class PCGTreeCandidate {
	// Root node is the first room after the start room
	var rootNode : PCGTreeNode;
	// End node is the exit room and has a value of -1 as the geometryID
	//var endNode : PCGTreeNode;
	
	// The probability that each node on the direct path will have branches
	var branchingProbability : float;
	
	// The rate at which branching decreases the further down a branch you go
	// e.g. The chance that a branch will have another room (or multiple) is less than
	// that of a direct path room.
	var branchingDecay : float;
	
	// How many nodes are on the direct path, not including exit room
	var directPathLength : int;
	
	// How many nodes are there in total
	var totalNodeCount : int;
	var maxNodeCount : int;
	
	// Adjacency matrix used for feature extraction for player modelling
	var adjacencyMatrix : int[,];
	
	// High level features
	var highLevelFeatures : PCGTreeHighLevelFeatures;
	
	function PCGTreeCandidate(rootnode : PCGTreeNode, maxNodes : int, branchProbability : float, branchDecay : float) {
		rootNode = rootnode;
		branchingProbability = branchProbability;
		branchingDecay = branchDecay;
		maxNodeCount = maxNodes;
		
		if (branchingProbability > 1)
			branchingProbability = 1;
		else if (branchingProbability < 0)
			branchingProbability = 0;
		
		if (branchingDecay > 1)
			branchingDecay = 1;
		else if (branchingDecay < 0)
			branchingDecay = 0;
			
		directPathLength = 0;
		totalNodeCount = 0;
		adjacencyMatrix = null;
	}
	
	
	function FillAdjacencyMatrix() {
		// initialize matrix
		// The +1 slot is for the exit room always. 
		// This is so we always know index 1 will be root node and index maxNodeCount+1 will always be the exit room
		adjacencyMatrix = new int[maxNodeCount+1,maxNodeCount+1];
		for (var i : int = 0; i < maxNodeCount+1; i++) {
			for (var j : int = 0; j < maxNodeCount+1; j++) {
				adjacencyMatrix[i,j] = 0;
			}
		}
		
		// Traverse in a breadth first search approach, this is oppose to the DFS of all the recursive calls. 
		// BFS is a cleaner representation for the player modeling, the adjacency matrix will be more consistent
		var nodeQueue : Queue = new Queue();	
		nodeQueue.Enqueue(rootNode);
		var currentNodeIndex : int = 0;
		var queueCounter : int = 0;
		while(nodeQueue.Count > 0) {
			var currentNode : PCGTreeNode = nodeQueue.Dequeue() as PCGTreeNode;
			for (var k : int in currentNode.childNodes.Keys) {
				if (currentNode.childNodes[k].geometryID == PCGTreeNode.exitRoom) {
					// Always make the last index (maxNodeCount+1) be the exit room. 
					// This then clearly shows which node is connected to start room and which to exit room
					adjacencyMatrix[currentNodeIndex,maxNodeCount] = 1;
					adjacencyMatrix[maxNodeCount,currentNodeIndex] = 1;
				}
				else {
					queueCounter++;
					adjacencyMatrix[currentNodeIndex,queueCounter] = 1;
					adjacencyMatrix[queueCounter,currentNodeIndex] = 1;	// Reflected accross the diagonal							
					nodeQueue.Enqueue(currentNode.childNodes[k]);
				}
			}
			currentNodeIndex++;
		}
	}	
	
	function PrintAdjacencyMatrix() {
		var word : String = "";
		for (var i : int = 0; i < maxNodeCount+1; i++) {
			for (var j : int = 0; j < maxNodeCount+1; j++) {
				word = word+adjacencyMatrix[i,j];
			}
			word = word + "\n";
		}
		Debug.Log(word);
	}
	
	// For writing to file and using as feature vector in player modeling
	function GetConnectivityVector() : int[] {
		FillAdjacencyMatrix();
		
		// Count how many elements are under the diagonal ((size of matrix / 2)-(squareRoot if matrix size / 2)
		var vectorSize : int = (((maxNodeCount+1)*(maxNodeCount+1))/2) - ((maxNodeCount+1)/2); 		
		
		// As the diagonal will always be zero and the matrix is reflected across the diagonal,
		// only record whats under the diagonal
		var featureVector : int[] = new int[vectorSize];
		
		var vectorPos : int = 0;
		for (var i : int = 0; i < maxNodeCount+1; i++) {
			for (var j : int = 0; j < i; j++) {
				featureVector[vectorPos] = adjacencyMatrix[i,j];
				vectorPos++;
			}
		}
		return featureVector;
	}
	
	
	// For now, this does not include the geometry of the rooms. This means that a map cant really be recreated from this data.
	// In future, the geometry id may be added to the file write, but taken out before classification
	function GetContentVector(dummyRoom : PCGGenericRoomManager) : int[] {
		// Record content of every node even if there is no room there
		var vectorSize : int = PCGGenericRoomManager.numFeatures * maxNodeCount;		
		var contentVector : int[] = new int[vectorSize];		
		
		// Traverse in a breadth first search approach, the same as the adjacency matrix
		var nodeQueue : Queue = new Queue();	
		nodeQueue.Enqueue(rootNode);
		var currentNodeIndex : int = 0;
		while(nodeQueue.Count > 0) {
			var currentNode : PCGTreeNode = nodeQueue.Dequeue() as PCGTreeNode;
			
			// Each feature value is stored seperately for each room
			var settingsID : int = currentNode.combinedContentID;
			dummyRoom.IdToSettings(settingsID);			
			var vectorOffset : int = currentNodeIndex*PCGGenericRoomManager.numFeatures;
			for (var i : int = 0; i < PCGGenericRoomManager.numFeatures; i++) {					
				contentVector[vectorOffset+i] = dummyRoom.featureSettings[i];
			}
			
			// Add children to the queue
			for (var k : int in currentNode.childNodes.Keys) {
				if (currentNode.childNodes[k].geometryID != PCGTreeNode.exitRoom) {					
					nodeQueue.Enqueue(currentNode.childNodes[k]);
				}
			}			
			currentNodeIndex++;
		}		
		return contentVector; 
	}
	
	function GetHighLevelFeatureString(dummyRoom : PCGGenericRoomManager) : String { 
		highLevelFeatures = new PCGTreeHighLevelFeatures();
		rootNode.RecursiveHighLevelFeatureCompile(this, PCGTreeHighLevelFeatures.HL_ROOMTYPE.NoPreviousRoom, dummyRoom);
		
		var dataString : String = highLevelFeatures.GetFeatureString();		
		return dataString;
	}
}