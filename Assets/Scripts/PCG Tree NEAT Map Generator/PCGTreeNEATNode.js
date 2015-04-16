#pragma strict

class PCGTreeNEATNode extends PCGTreeNode {
	public static var mutationCounts : int[] = [0,0,0];
	// The sibling index of the current node with respect to children with the same parent (not a total index of all nodes at that depth). 
	// Having this seperate means that changing number of doors due to change in 
	// geomId doesn't result in a change in sibling id
	private var siblingIndex : int;
	
	function PCGTreeNEATNode(contentId:int, geomTemplateID:int, inboundDoorId:int, inboundCorridorId:int, onDirectPath:boolean, geomBuilder:PCGTreeGeometryBuilder, fixedSiblingIndex : int) {
		siblingIndex = fixedSiblingIndex;
		super(contentId, geomTemplateID, inboundDoorId, inboundCorridorId, onDirectPath, geomBuilder);
	}
	
	// Copy constructor, just use super
	function PCGTreeNEATNode(oldNode : PCGTreeNEATNode) {
		super(oldNode);
	}
	
	function GetSiblingIndex() : int {
		return siblingIndex;
	}	
	
	function RecursiveTreeCopy(oldNode : PCGTreeNEATNode) {		
		for (var j : int in oldNode.childNodes.Keys) {
			// Make a copy of each child from the old node and connect it to this one
			var newChild : PCGTreeNEATNode = new PCGTreeNEATNode(oldNode.childNodes[j] as PCGTreeNEATNode);
			this.AddChildAtDoor(j,newChild);
			
			// Then do the same for each of the childs children
			newChild.RecursiveTreeCopy(oldNode.childNodes[j] as PCGTreeNEATNode);
		}
	}

	function RecursiveFixedTreeMutation(candidate : PCGTreeCandidate, previousNode : PCGTreeNode, currentBranchProb : float, mutationRate : float, minDirectPathLength : int, maxDirectPathLength : int) {		
		// Update the branching rate (doesn't matter if Mutation_Add is going to be used or not, still need to update)
		// If this node is on the direct path, reset the branch probability 
		if (directPath)
			currentBranchProb = candidate.branchingProbability;
		// Otherwise, decay it the further it gets from the directPath
		else 
			currentBranchProb = currentBranchProb - (currentBranchProb*candidate.branchingDecay);		
		
		// Default to this node so that if mutation test doesnt pass, just continue to this nodes children	
		var currentNode : PCGTreeNEATNode = this as PCGTreeNEATNode;
		
		var test : float = Random.value;
		if (test <= mutationRate) {							
			var randVal : float = Random.value;
			// Mutation - add
			if (randVal < (1.0f/3.0f)) {
				mutationCounts[0]++;
				currentNode = RecursiveMutation_Add(candidate, previousNode, currentBranchProb) as PCGTreeNEATNode;
			}
			// Mutation - remove
			else if (randVal >= (1.0f/3.0f) && randVal < (2.0f/3.0f)) {
				if (geometryID != exitRoom)	{
					if (this.directPath) {
						if (candidate.directPathLength > minDirectPathLength) {				
							currentNode = RecursiveMutation_Remove(candidate, previousNode) as PCGTreeNEATNode;
							mutationCounts[1]++;
						}
					}
					else {
						currentNode = RecursiveMutation_Remove(candidate, previousNode) as PCGTreeNEATNode;
						mutationCounts[1]++;
					}
				}
			}
			// Mutation - permutation
			else {
				if (geometryID != exitRoom)	{
					currentNode = RecursivePermutation(candidate, previousNode) as PCGTreeNEATNode;
					mutationCounts[2]++;
				}
			}					
		}		
		
		// Cant use foreach loop directly on childNodes because a hashtable cant change in its own foreach loop
		if (currentNode != null) {
			var keyArray : int[] = new int[currentNode.childNodes.Count];
			var i : int = 0;		
			for (var j : int in currentNode.childNodes.Keys) {
				keyArray[i] = j;
				i++;
			}
			// Recursive call to all children
			for (i = 0; i < keyArray.Length; i++)
				(currentNode.childNodes[keyArray[i]] as PCGTreeNEATNode).RecursiveFixedTreeMutation(candidate, currentNode, currentBranchProb, mutationRate, minDirectPathLength, maxDirectPathLength);
		}
	}
	
	function RecursiveCPPNContentCalculator(contentEA : PCGNeatEA, currentDepth : int, currentSiblingOffset : int, maxDepth : int, maxBranching : int) {
		if (geometryID == exitRoom)
			return;
			
		// Calculate the sibling index with respect to all nodes at this depth
		var totalSiblingIndex : int = currentSiblingOffset+siblingIndex;
		
		var cppnOutput : double[] = contentEA.GetChampOutput(currentDepth, totalSiblingIndex, maxDepth, maxBranching);
		combinedContentID = PCGGenericRoomManager.CPPNOutputToSettingsId(cppnOutput);
		
		//Debug.Log("Node Coord: (" + currentDepth + "," + totalSiblingIndex +"), Geometry: " + geometryID + ", combinedContentID: " + combinedContentID);
		
		// Recursive call to all children
		for (var i : int = 0; i < geometryBuilder.GetNumDoors(geometryID); i++) {
			if (childNodes.ContainsKey(i)) {
				(childNodes[i] as PCGTreeNEATNode).RecursiveCPPNContentCalculator(contentEA, (currentDepth+1), (totalSiblingIndex*(PCGGenericRoomManager.maxDoors-1)), maxDepth, maxBranching);
			}
		}
	}
	
	//Includes exit node but not start node. I.e. candidate rootNode is depth 0
	// This is because exitNode takes up a position in the fixedTree representation
	function RecursiveFindMaxDepth(currentDepth : int) : int {
		// No children, return the current depth
		if (childNodes.Count == 0) {
			return currentDepth;
		}
		
		// Otherwise, search children for highest depth
		var largestDepth : int = 0;
		for (var i : int = 0; i < geometryBuilder.GetNumDoors(geometryID); i++) {
			if (childNodes.ContainsKey(i)) {
				var childDepth : int = (childNodes[i] as PCGTreeNEATNode).RecursiveFindMaxDepth(currentDepth+1);
				if (childDepth > largestDepth)
					largestDepth = childDepth;
			}
		}
		return largestDepth;			
	}
	
	function RecursiveJtoCTreeConversion(nodeList : List.<PCGNeatNodeData>, previousNode : PCGNeatNodeData, currentDepth : int, currentSiblingOffset : int, maxDepth : int, maxBranching : int) {
		// Dont do this for the exit room
		if (geometryID == exitRoom)
			return;
		
		// Calculate the sibling index with respect to all nodes at this depth
		var totalSiblingIndex : int = currentSiblingOffset+siblingIndex;
		
		// Normalize nodeDepth and nodeSiblingNum to range of 0-1. This may affect outputs?
		var normDepth : double = parseFloat(currentDepth)/parseFloat(maxDepth);
		var normSib : double;
		if (currentDepth == 0)
			normSib = 0; // Only one node at depth 0, prevent a divide by 0 error
		else
			normSib = parseFloat(totalSiblingIndex) / parseFloat((Mathf.Pow(maxBranching,currentDepth)-1));
		var newNodeData : PCGNeatNodeData = new PCGNeatNodeData(previousNode, normDepth, normSib,combinedContentID);
		nodeList.Add(newNodeData);
		
		// Recursive call to all children
		if (geometryID != exitRoom) {
			for (var i : int = 0; i < geometryBuilder.GetNumDoors(geometryID); i++) {
				if (childNodes.ContainsKey(i)) {
					(childNodes[i] as PCGTreeNEATNode).RecursiveJtoCTreeConversion(nodeList, newNodeData, (currentDepth+1), (totalSiblingIndex*(PCGGenericRoomManager.maxDoors-1)), maxDepth, maxBranching);
				}
			}
		}		
	}
	
	
	function RecursiveTreeToStringList(theList : List.<String>, parentIndex : int, parentDoorId : int) {
		var nodeAsString : String = this.combinedContentID + "," + this.geometryID + ","
							+ this.inboundDoor + "," + this.inboundCorridor + ","
							+ this.directPath + "," + this.siblingIndex + "," 
							+ parentIndex + "," + parentDoorId;
		theList.Add(nodeAsString);	
		parentIndex = theList.Count-1;
		
		// Recursive call to all children
		if (geometryID != exitRoom) {
			for (var i : int = 0; i < geometryBuilder.GetNumDoors(geometryID); i++) {
				if (childNodes.ContainsKey(i)) {
					(childNodes[i] as PCGTreeNEATNode).RecursiveTreeToStringList(theList, parentIndex,i);
				}
			}
		}
	}
	
	
	// Remember to downcast after calling this method as return type must be PCGTreeNode
	function RandomNewNEATNode(parentNode : PCGTreeNEATNode) : PCGTreeNEATNode {		
		// This is mostly same as a Linear Random map, but only with the inbound door, outbound doors handled by AddChild
		var roomGeometry : int = Random.Range(0,geometryBuilder.numRoomGeom);
		var roomContent : int = 0;
		var inCorridor : int = Random.Range(0,geometryBuilder.numCorrGeom);
		var numDoors : int = geometryBuilder.GetNumDoors(roomGeometry);	
		var inDoor : int = Random.Range(0,numDoors);
		
		var siblingIndex : int = 0;
		if (parentNode!=null) {
			if (geometryBuilder.randomSibIndex)
				siblingIndex = parentNode.RandomFreeChildSiblingIndex(false);
			else
				siblingIndex = parentNode.FirstFreeChildSiblingIndex();			
		}
			
			
		if (siblingIndex < 0)
			Debug.LogError("MAJOR ERROR! no free sibling index, this shouldn't happen because of free door checks");
			
		// Create the new node with the above settings
		var newNode : PCGTreeNEATNode = new PCGTreeNEATNode(roomContent, roomGeometry, inDoor, inCorridor, false, geometryBuilder, siblingIndex);
		return newNode;
	}
	
	// Remember to downcast after calling this method as return type must be PCGTreeNode
	function RandomNewNEATNode(parentNode : PCGTreeNEATNode, rootNode : boolean) : PCGTreeNEATNode {		
		// This is mostly same as a Linear Random map, but only with the inbound door, outbound doors handled by AddChild
		var roomGeometry : int = Random.Range(0,geometryBuilder.numRoomGeom);
		var roomContent : int = 0;
		var inCorridor : int = Random.Range(0,geometryBuilder.numCorrGeom);
		var numDoors : int = geometryBuilder.GetNumDoors(roomGeometry);	
		var inDoor : int = Random.Range(0,numDoors);
		
		var siblingIndex : int = 0;
		if (parentNode!=null) {
			if (geometryBuilder.randomSibIndex)
				if (rootNode)
					siblingIndex = parentNode.RandomFreeChildSiblingIndex(true);
				else
					siblingIndex = parentNode.RandomFreeChildSiblingIndex(false);
			else
				siblingIndex = parentNode.FirstFreeChildSiblingIndex();			
		}
			
			
		if (siblingIndex < 0)
			Debug.LogError("MAJOR ERROR! no free sibling index, this shouldn't happen because of free door checks");
			
		// Create the new node with the above settings
		var newNode : PCGTreeNEATNode = new PCGTreeNEATNode(roomContent, roomGeometry, inDoor, inCorridor, false, geometryBuilder, siblingIndex);
		return newNode;
	}
	
	
	function FirstFreeChildSiblingIndex() : int {
		// Check each index in order to see if its free. This will always build the tree from left to right
		for (var i : int; i < PCGGenericRoomManager.maxDoors-1; i++) {
			var indexUsed : boolean = false;
			for (var j : int in childNodes.Keys) {
				// Check if the index has been used by any of the existing children
				if ((childNodes[j] as PCGTreeNEATNode).siblingIndex == i) {
					indexUsed = true;
					break;
				}
			}
			
			// This index is not in use, return it
			if (!indexUsed) 
				return i;
		}
		
		// No free index
		return -1;
	}
	
	function RandomFreeChildSiblingIndex(root : boolean) : int {
		if (root)
			return 0;
			
		// Search randomly for a free sibling index. No sibling ordering enforced.
		var unusedID : List.<int> = new List.<int>();
		for (var i : int; i < PCGGenericRoomManager.maxDoors-1; i++) {
			var indexUsed : boolean = false;
			for (var j : int in childNodes.Keys) {
				// Check if the index has been used by any of the existing children
				if ((childNodes[j] as PCGTreeNEATNode).siblingIndex == i) {
					indexUsed = true;
					break;
				}
			}
			
			// This index is not in use, return it
			if (!indexUsed) 
				unusedID.Add(i);
		}
		
		if (unusedID.Count == 0){
			// No free index
			return -1;
		}
		else {
			// Randomly pick an index to return
			return (unusedID[Random.Range(0,unusedID.Count)]);
		}
	}

	function RecursiveSharpHighLevelFeatureCompile(featureCollector : PCGSharpHighLevelFeatures, lastRoomType : PCGSharpHighLevelFeatures.C_HL_ROOMTYPE) {
		// Dont do this for the exit room, this keeps in line with JtoCConversion, and therefore the classifier doesnt consider the exit room
		if (geometryID == exitRoom)
			return;
			
		var roomType : PCGSharpHighLevelFeatures.C_HL_ROOMTYPE = featureCollector.UpdateFeatures(combinedContentID, lastRoomType);
				
		for (var j : int in childNodes.Keys) {
			(childNodes[j] as PCGTreeNEATNode).RecursiveSharpHighLevelFeatureCompile(featureCollector, roomType); 
		}	
	}

	function RecursiveClearContentSettings() {
		combinedContentID = 0;
		for (var j : int in childNodes.Keys) {
			(childNodes[j] as PCGTreeNEATNode).RecursiveClearContentSettings(); 
		}	
	}
	
	function RecursiveRandomContentSettings() {
		var numRoomSettings : int = Mathf.Pow(PCGGenericRoomManager.numSettings, PCGGenericRoomManager.numFeatures);
		combinedContentID =  Random.Range(0,numRoomSettings);
		for (var j : int in childNodes.Keys) {
			(childNodes[j] as PCGTreeNEATNode).RecursiveRandomContentSettings(); 
		}
	}
}