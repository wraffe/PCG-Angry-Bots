#pragma strict

/* This is the equivilant of PCGLinearGene. 
 * A Candidate class exists to hold the root node. */
class PCGTreeNode {
	var combinedContentID : int;
	var geometryID : int;
	var inboundDoor : int;
	var inboundCorridor : int;
	var directPath : boolean;
	
	final static var noFreeDoor = -1;
	final static var exitRoom = -2;
	
	// Children stored as hashtable where the key is a door of the room
	var childNodes : Dictionary.<int,PCGTreeNode>;
	
	protected var geometryBuilder : PCGTreeGeometryBuilder;
	
	
	/**************** Tree Data Structure Functions **************/
	function PCGTreeNode(contentId:int, geomTemplateID:int, inboundDoorId:int, inboundCorridorId:int, onDirectPath:boolean, geomBuilder:PCGTreeGeometryBuilder) {
		combinedContentID = contentId;
		geometryID = geomTemplateID;
		inboundDoor = inboundDoorId;
		inboundCorridor = inboundCorridorId;
		directPath = onDirectPath;
		
		childNodes = new Dictionary.<int,PCGTreeNode>();
		
		if (geomBuilder == null)
			geometryBuilder = GameObject.FindWithTag("MapManager").GetComponent(PCGTreeGeometryBuilder);
		else 		
			geometryBuilder = geomBuilder;
	}
	
	
	// Copy constructor
	function PCGTreeNode(oldNode : PCGTreeNode) {
		combinedContentID = oldNode.combinedContentID;
		geometryID = oldNode.geometryID;
		inboundDoor = oldNode.inboundDoor;
		inboundCorridor = oldNode.inboundCorridor;
		directPath = oldNode.directPath;
		
		childNodes = new Dictionary.<int,PCGTreeNode>();
		
		if (oldNode.geometryBuilder == null)
			geometryBuilder = GameObject.FindWithTag("MapManager").GetComponent(PCGTreeGeometryBuilder);
		else 		
			geometryBuilder = oldNode.geometryBuilder;
	}
	
	
	function AddChild(newChild : PCGTreeNode) : boolean {
		var newDoor = RandomFreeDoor();
		
		// No free doors to add a child node
		if (newDoor == noFreeDoor)
			return false;
		
		childNodes.Add(newDoor, newChild);	
		return true;		
	}
	
	
	function AddChildAtDoor(doorID : int, newChild : PCGTreeNode) : boolean {
		if (childNodes.ContainsKey(doorID))
			return false;
		if (doorID == inboundDoor)
			Debug.LogError("Child being added to inboundDoor");
			
		childNodes.Add(doorID, newChild);
		return true;
	}
	
	
	function RemoveChild(oldChild : PCGTreeNode) : int {
		var removeIndex : int = -1;
		for (var j : int in childNodes.Keys) {
			if (childNodes[j] == oldChild) {
				removeIndex = j;
			}
		}
		childNodes.Remove(removeIndex);
		return removeIndex;		
	}
	
	// Used mainly to get the second parents node in Recombination
	function GetDirectPathNode(position : int, nodeCount : int) : PCGTreeNode {
		var returnedNode : PCGTreeNode;		
		if (!directPath) {
			Debug.LogError("Not direct path!");
			returnedNode = null;
		}
		if (geometryID == exitRoom) {
			Debug.LogError("Is exit room");
			returnedNode = null;
		}
		else {		
			if (nodeCount == position)
				return this;
			else {
				for (var i : int in childNodes.Keys) {
					if (childNodes[i].directPath) {
						nodeCount++;
						returnedNode = childNodes[i].GetDirectPathNode(position, nodeCount);
					}
				}
			}
		}
		return returnedNode;
	}	
	
	
	// Creates random branches. Doesn't do recursion on child nodes that already exist, this stops over inflation and redundant recursion
	// Recursive is the easier way of fleshing out a random candidate
	function RecursiveBranching(candidate : PCGTreeCandidate, currentBranchProbability : float, branchDecay : float) {		
		// branchedDoors ensures that only branches created here are recursively branched
		// This prevents existing nodes (e.g. already added directPath or exitRoom nodes) from being branched here, they will be branched later.
		var doorBranched : boolean[] = new boolean[geometryBuilder.GetNumDoors(geometryID)];
		for (var i : int = 0; i < geometryBuilder.GetNumDoors(geometryID); i++) {
			doorBranched[i] = false;
			// Attempt to branch at each free door of this node
			if (!childNodes.ContainsKey(i) && (i != inboundDoor)) {
				// Branch probability test
				if (this.GetType() == PCGTreeNode) {
					if ((Random.value < currentBranchProbability) && (candidate.totalNodeCount < candidate.maxNodeCount)) {
						var newTreeNode = RandomNewNode();
						AddChildAtDoor(i,newTreeNode);
						candidate.totalNodeCount++;
						doorBranched[i] = true;	
					}				
				}
				else if (this.GetType() == PCGTreeNEATNode) {
					// No need to test for node count with PCGTreeNEATNode
					if (Random.value < currentBranchProbability) {
						var newNeatNode = (this as PCGTreeNEATNode).RandomNewNEATNode(this as PCGTreeNEATNode);
						AddChildAtDoor(i,newNeatNode);
						candidate.totalNodeCount++;
						doorBranched[i] = true;	
					}
				}
			}
		}
		
		// The chance of branching is reduced by the percentage branchDecay at every level of a branch from the main tree path
		currentBranchProbability = currentBranchProbability - (currentBranchProbability*branchDecay);
		// Attemp branches in each of the newly created children
		for (var j : int in childNodes.Keys) { 
			if (doorBranched[j]) {
				childNodes[j].RecursiveBranching(candidate, currentBranchProbability, branchDecay);
			}
		}		
	}
	
	
	
	/************ Evolutionary Operators ***************/
	// This function decides whether or not the current node should mutate, then it chooses which mutation operator to use (add, remove, or permutate)
	function RecursiveMutation(candidate : PCGTreeCandidate, previousNode : PCGTreeNode, currentBranchProb : float, mutationRate : float, minDirectPathLength : int, maxDirectPathLength : int) {		
		// Update the branching rate (doesn't matter if Mutation_Add is going to be used or not, still need to update)
		// If this node is on the direct path, reset the branch probability 
		if (directPath)
			currentBranchProb = candidate.branchingProbability;
		// Otherwise, decay it the further it gets from the directPath
		else 
			currentBranchProb = currentBranchProb - (currentBranchProb*candidate.branchingDecay);		
		
		// Default to this node so that if mutation test doesnt pass, just continue to this nodes children	
		var currentNode : PCGTreeNode = this;
		
		var test : float = Random.value;
		if (test <= mutationRate) {
			// Too Long, mutation remove
			if (candidate.directPathLength >= maxDirectPathLength && this.directPath) {
				if (geometryID != exitRoom)					
					currentNode = RecursiveMutation_Remove(candidate, previousNode);
			}			
			// Too short, mutation add
			else if (candidate.directPathLength <= minDirectPathLength && this.directPath)
			{
				currentNode = RecursiveMutation_Add(candidate, previousNode, currentBranchProb);	
			}
			// Randomly pick	
			else {				
				var randVal : float = Random.value;
				// Mutation - add
				if (randVal < (1/3)) 
					currentNode = RecursiveMutation_Add(candidate, previousNode, currentBranchProb);
				// Mutation - remove
				else if (randVal >= (1/3) && randVal < (2/3)) {
					if (geometryID != exitRoom)					
						currentNode = RecursiveMutation_Remove(candidate, previousNode);
				}
				// Mutation - permutation
				else {
					if (geometryID != exitRoom)	
						currentNode = RecursivePermutation(candidate, previousNode);
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
				currentNode.childNodes[keyArray[i]].RecursiveMutation(candidate, currentNode, currentBranchProb, mutationRate, minDirectPathLength, maxDirectPathLength);
		}
	}
	
	
	function RecursiveRampantMutation(candidate : PCGTreeCandidate, previousNode : PCGTreeNode, currentBranchProb : float, mutationRate : float) {		
		// Update the branching rate (doesn't matter if Mutation_Add is going to be used or not, still need to update)
		// If this node is on the direct path, reset the branch probability 
		if (directPath)
			currentBranchProb = candidate.branchingProbability;
		// Otherwise, decay it the further it gets from the directPath
		else 
			currentBranchProb = currentBranchProb - (currentBranchProb*candidate.branchingDecay);		
		
		// Default to this node so that if mutation test doesnt pass, just continue to this nodes children	
		var currentNode : PCGTreeNode = this;
		
		var test : float = Random.value;
		// Only doing mutation add
		if (test <= mutationRate) {
			// Only do mutation add on branches to stop direct path from growing
			if (!directPath)
				currentNode = RecursiveMutation_Add(candidate, previousNode, currentBranchProb);	
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
			for (i = 0; i < keyArray.Length; i++) {
				if (candidate.totalNodeCount >= candidate.maxNodeCount)
					return;
				else
					currentNode.childNodes[keyArray[i]].RecursiveRampantMutation(candidate, currentNode, currentBranchProb, mutationRate);
			}	
		}
	}
	
	
	// If current node is mutating, add a new node before it (between this node and previousNode) and then do branching on new node
	function RecursiveMutation_Add(candidate : PCGTreeCandidate, previousNode : PCGTreeNode, currentBranchProb : float) : PCGTreeNode {
		var newNode : PCGTreeNode;
		if (this.GetType() == PCGTreeNode)
			newNode = RandomNewNode(); 
		else if (this.GetType() == PCGTreeNEATNode) 
			newNode = (this as PCGTreeNEATNode).RandomNewNEATNode(previousNode as PCGTreeNEATNode);
			
		if (directPath) {
			newNode.directPath = true;
			candidate.directPathLength++;
		}
			
		// If this node is the root node, make the new node the root node now
		if (candidate.rootNode == this)
			candidate.rootNode = newNode;
		else {
			// Otherwise, remove this node from the previous nodes list of children
			var removalIndex : int = previousNode.RemoveChild(this);
			// Then add the new node in its place
			previousNode.AddChildAtDoor(removalIndex, newNode);							
		}
		
		// And now make this node a child of the new node
		newNode.AddChild(this);	
		// And finally perform branching on the new node
		newNode.RecursiveBranching(candidate, currentBranchProb, candidate.branchingDecay);
		
		// Continue mutation calls from this node, not the new node. This prevents rampant mutation on new branches
		return this;				
	}
	
	
	// If current node is mutating, remove it and any non-directPath branches.
	function RecursiveMutation_Remove(candidate : PCGTreeCandidate, previousNode : PCGTreeNode) : PCGTreeNode {
		// If this isnt a directPath node, remove it and all its children
		if (!directPath) {
			previousNode.RemoveChild(this);
			// The entire branch is disconnected from the tree so dont do mutation on it anymore, move back up the recursion
			return null; 
		}
		// If this is a directPath node, move the next directPath node up to fill this space in the tree
		else {
			var nextDirectPath : PCGTreeNode;
			for (var j : int in childNodes.Keys) {
				if (childNodes[j].directPath)
					nextDirectPath = childNodes[j];
			}
			if (nextDirectPath == null)
 				Debug.LogError("No direct path found in child! Something has gone very wrong");
			
			if (candidate.rootNode == this)
				candidate.rootNode = nextDirectPath;
			else {
				// Remove this node and all its children
				var removalIndex : int = previousNode.RemoveChild(this);
				// Add the next directPath node back into the previous nodes child list
				previousNode.AddChildAtDoor(removalIndex, nextDirectPath);
			}
			
			candidate.directPathLength--;
			
			// Continue recursion calls if this was a direct path node, otherwise all children are gone so it cant be continued
			return nextDirectPath;
		}					
	}
	
	
	// Change the roomID value of a single node
	function RecursivePermutation(candidate : PCGTreeCandidate, previousNode : PCGTreeNode) : PCGTreeNode {
		var currentNode : PCGTreeNode = this;
		
		var index : int = -1;
		if (previousNode != null)
			index = previousNode.RemoveChild(this);

		var newNode : PCGTreeNode;
		if (this.GetType() == PCGTreeNode)
			newNode = RandomNewNode(); 
		else if (this.GetType() == PCGTreeNEATNode) { 
			newNode = (this as PCGTreeNEATNode).RandomNewNEATNode(previousNode as PCGTreeNEATNode);
		}
		
		if (directPath)
			newNode.directPath = true;
		
		// If there is a direct path child, make sure that is assigned to the child list of the new node first
		for (var j : int in childNodes.Keys) {
			if (childNodes[j].directPath)
				newNode.AddChild(childNodes[j]);
		}
		// Add as many of the other children as possible to the new node
		for (var j : int in childNodes.Keys) {
			var childAdded : boolean;
			if (!childNodes[j].directPath) {
				childAdded = newNode.AddChild(childNodes[j]);
				if (!childAdded)
					break; // No more free doors so stop trying to add children
			}
		}
		
		// If this node is the root of the candidate simpyl change the reference in the candidate
		if (previousNode == null)
			candidate.rootNode = newNode;
		else {				
			// Assign the newNode as a child to the previous node
			if (index == -1)
				Debug.LogWarning("Couldn't Remove Node. It doesn't exist as a child of the previous node");
			previousNode.AddChildAtDoor(index,newNode);
		}
		
		// Continue mutation from the new node
		return newNode;
	}
	
	
	// Move through each node and copy the children from the parent tree to the new one
	function RecursiveRecombination(newCandidate : PCGTreeCandidate, parentsNode : PCGTreeNode, otherParentsStartingNode : PCGTreeNode, crossoverPoint : int) {
		var copyChild : PCGTreeNode;
		
		// Switch over to other tree 
		if (newCandidate.directPathLength == crossoverPoint && this.directPath) {
			newCandidate.directPathLength++;
			
			// Find the direct path child first and make sure it is added
			for (var j : int in otherParentsStartingNode.childNodes.Keys) {
				if (otherParentsStartingNode.childNodes[j].directPath) {
					copyChild  = new PCGTreeNode(otherParentsStartingNode.childNodes[j]);
					this.AddChild(copyChild);
					// Can do recursion in here because the loop is basedo n the parentNode, not on this node
					copyChild.RecursiveRecombination(newCandidate, otherParentsStartingNode.childNodes[j], null, crossoverPoint);
				}
			}		 
			
			// Add as many of the other children as possible from the other evolutionary parents crossover point 
			for (var j : int in otherParentsStartingNode.childNodes.Keys) {
				var childAdded : boolean;
				if (!otherParentsStartingNode.childNodes[j].directPath) {
					copyChild = new PCGTreeNode(otherParentsStartingNode.childNodes[j]);
					childAdded = this.AddChild(copyChild);
					if (!childAdded)
						break; // No more free doors so stop trying to add children
					else
						copyChild.RecursiveRecombination(newCandidate, otherParentsStartingNode.childNodes[j], null, crossoverPoint);
				}
			}	
		} 
		
		// Otherwise, keep adding children on this tree 
		else {
			if (this.directPath && (geometryID != exitRoom))
				newCandidate.directPathLength++;
			// Copy all children from the evolutionary parent to this new offspring
			for (var j : int in parentsNode.childNodes.Keys) {
				copyChild = new PCGTreeNode(parentsNode.childNodes[j]);
				this.AddChild(copyChild);
				copyChild.RecursiveRecombination(newCandidate, parentsNode.childNodes[j], otherParentsStartingNode, crossoverPoint);
			}
		}
	}
	
	
	/********** Geometry Build Functions *************/
	function RecursiveValidate(previousRoomM : PCGGenericRoomManager, previousRoomDoor : int, candidate : PCGTreeCandidate, mapParent : GameObject) {
		// Instantiate the corridor and connect it to the previous room
		var corrPrefab : PCGGenericRoomManager = geometryBuilder.corridorPrefabs[inboundCorridor];
		var corrM : PCGGenericRoomManager = GameObject.Instantiate(corrPrefab,Vector3(0,0,0), Quaternion.identity);	
		geometryBuilder.ConnectAnchors(previousRoomM.transform, corrM.transform, previousRoomM.doorAnchors[previousRoomDoor], corrM.doorAnchors[0]);
		
		// Instantiate the room and connect it to the corridor
		var roomPrefab : PCGGenericRoomManager;
		if (geometryID == exitRoom) {
			// Exit room has a roomId of -2		
			//Debug.Log("Last Room. Attaching Exit Room");
			roomPrefab = geometryBuilder.endRoomPrefab;
		}
		else {
			roomPrefab = geometryBuilder.roomPrefabs[geometryID];
		}		
		var roomM : PCGGenericRoomManager = GameObject.Instantiate(roomPrefab,Vector3(0,0,0), Quaternion.identity);
		geometryBuilder.ConnectAnchors(corrM.transform, roomM.transform, corrM.doorAnchors[1], roomM.doorAnchors[inboundDoor]);
		
		//Parent rooms for easy removal later
		corrM.transform.parent = mapParent.transform; 
		roomM.transform.parent = mapParent.transform;
		
		// Recursive call to all children
		if (geometryID != exitRoom) {
			for (var i : int = 0; i < geometryBuilder.GetNumDoors(geometryID); i++) {
				if (childNodes.ContainsKey(i)) {
					childNodes[i].RecursiveValidate(roomM, i, candidate, mapParent);
				}
			}
		}	
	}	
	
	/* Mostly the same as RecursiveValidate but with a few extra steps to get the transofrm of the room and its content */
	function RecursiveBuild(previousRoomT : Transform, previousRoomDoor : int, candidate : PCGTreeCandidate, mapParent : GameObject, depth : int) {
		var previousRoomM : PCGGenericRoomManager = previousRoomT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
		
		// Instantiate the corridor and connect it to the previous room
		var corrPrefab : PCGGenericRoomManager = geometryBuilder.corridorPrefabs[inboundCorridor];
		var corrT : Transform = GameObject.Instantiate(corrPrefab.transform.parent,Vector3(0,0,0), Quaternion.identity);	
		var corrM : PCGGenericRoomManager = corrT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
		GameObject.Destroy(corrM.transform.Find("RoomBoundaries").gameObject);
		
		geometryBuilder.ConnectAnchors(previousRoomT, corrT, previousRoomM.doorAnchors[previousRoomDoor], corrM.doorAnchors[0]);
		// Unlock the door of the parent room (node)
		geometryBuilder.UnPermaLockDoor(previousRoomM, previousRoomDoor);
		
		// Instantiate the room and connect it to the corridor
		var roomPrefab : PCGGenericRoomManager;
		if (geometryID == exitRoom) {
			// Exit room has a roomId of -2		
			//Debug.Log("Last Room. Attaching Exit Room");
			roomPrefab = geometryBuilder.endRoomPrefab;
		}
		else {
			roomPrefab = geometryBuilder.roomPrefabs[geometryID];
		}		
		var roomT : Transform = GameObject.Instantiate(roomPrefab.transform.parent,Vector3(0,0,0), Quaternion.identity);	
		var roomM : PCGGenericRoomManager = roomT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
		// Let the room know about its own tree location
		if (this.GetType() == PCGTreeNEATNode) 
			roomM.SetTreeID(depth, (this as PCGTreeNEATNode).GetSiblingIndex());
			
		// Make sure all doors are reset (i.e. permaLock = true, puzzleLock = false)
		geometryBuilder.ResetDoorLocks(roomM);
		GameObject.Destroy(roomM.transform.Find("RoomBoundaries").gameObject); 
		if (geometryID != exitRoom)
			geometryBuilder.SetContent(combinedContentID,roomM);
			
		geometryBuilder.ConnectAnchors(corrT, roomT, corrM.doorAnchors[1], roomM.doorAnchors[inboundDoor]);	
		// Unlock the door the just got connected to
		geometryBuilder.UnPermaLockDoor(roomM, inboundDoor);
		
		//Parent rooms for easy removal later
		corrT.parent = mapParent.transform; 
		roomT.parent = mapParent.transform;
		
		// Recursive call to all children
		if (geometryID != exitRoom) {
			depth++;
			for (var i : int = 0; i < geometryBuilder.GetNumDoors(geometryID); i++) {
				if (childNodes.ContainsKey(i)) {
					childNodes[i].RecursiveBuild(roomT, i, candidate, mapParent,depth);
				}
			}
		}
	}	
	
		
	/* Mostly the same as RecursiveValidate but with a few extra steps to get the transofrm of the room and its content */
	function RecursiveBuildForEditor(previousRoomT : Transform, previousRoomDoor : int, candidate : PCGTreeCandidate, mapParent : GameObject, destroyList : List.<GameObject>) {
		var previousRoomM : PCGGenericRoomManager = previousRoomT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
		
		// Instantiate the corridor and connect it to the previous room
		var corrPrefab : PCGGenericRoomManager = geometryBuilder.corridorPrefabs[inboundCorridor];
		var corrT : Transform = GameObject.Instantiate(corrPrefab.transform.parent,Vector3(0,0,0), Quaternion.identity);	
		var corrM : PCGGenericRoomManager = corrT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
		destroyList.Add(corrM.transform.Find("RoomBoundaries").gameObject);
		
		geometryBuilder.ConnectAnchors(previousRoomT, corrT, previousRoomM.doorAnchors[previousRoomDoor], corrM.doorAnchors[0]);
		// Unlock the door of the parent room (node)
		geometryBuilder.UnPermaLockDoor(previousRoomM, previousRoomDoor);
		
		// Instantiate the room and connect it to the corridor
		var roomPrefab : PCGGenericRoomManager;
		if (geometryID == exitRoom) {
			// Exit room has a roomId of -2		
			//Debug.Log("Last Room. Attaching Exit Room");
			roomPrefab = geometryBuilder.endRoomPrefab;
		}
		else {
			roomPrefab = geometryBuilder.roomPrefabs[geometryID];
		}		
		var roomT : Transform = GameObject.Instantiate(roomPrefab.transform.parent,Vector3(0,0,0), Quaternion.identity);	
		var roomM : PCGGenericRoomManager = roomT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
		// Make sure all doors are reset (i.e. permaLock = true, puzzleLock = false)
		geometryBuilder.ResetDoorLocks(roomM);
		destroyList.Add(roomM.transform.Find("RoomBoundaries").gameObject);  
		//if (geometryID != exitRoom)
			//geometryBuilder.SetContent(combinedContentID,roomM);
			
		geometryBuilder.ConnectAnchors(corrT, roomT, corrM.doorAnchors[1], roomM.doorAnchors[inboundDoor]);	
		// Unlock the door the just got connected to
		geometryBuilder.UnPermaLockDoor(roomM, inboundDoor);
		
		//Parent rooms for easy removal later
		corrT.parent = mapParent.transform; 
		roomT.parent = mapParent.transform;
		
		// Recursive call to all children
		if (geometryID != exitRoom) {
			for (var i : int = 0; i < geometryBuilder.GetNumDoors(geometryID); i++) {
				if (childNodes.ContainsKey(i)) {
					childNodes[i].RecursiveBuildForEditor(roomT, i, candidate, mapParent, destroyList);
				}
			}
		}
	}			
			
				
	/********** Utilities ************/	
	function RandomFreeDoor() : int {		
		// If all the doors are taken, return an error
		// -1 because one of the doors is the inbound door
		if (geometryBuilder.GetNumDoors(geometryID)-1 == childNodes.Count)
			return noFreeDoor;
			
		var randomDoor = Random.Range(0,geometryBuilder.GetNumDoors(geometryID));
		while (childNodes.ContainsKey(randomDoor) || randomDoor == inboundDoor)
			randomDoor = Random.Range(0,geometryBuilder.GetNumDoors(geometryID));
			
		return randomDoor;		
	}
		
		
	function RandomNewNode() : PCGTreeNode {
		//Debug.LogWarning("Making a new PCGTreeNode. Are you sure you dont want a PCGTreeNEATNode");
		// This is mostly same as a Linear Random map, but only with the inbound door, outbound doors handled by AddChild
		var roomGeometry : int = Random.Range(0,geometryBuilder.numRoomGeom);
		var numRoomSettings : int = Mathf.Pow(PCGGenericRoomManager.numSettings, PCGGenericRoomManager.numFeatures);
		var roomContent : int = Random.Range(0,numRoomSettings);
		var inCorridor : int = Random.Range(0,geometryBuilder.numCorrGeom);
		var numDoors : int = geometryBuilder.GetNumDoors(roomGeometry);	
		var inDoor : int = Random.Range(0,numDoors);
			
		// Create the new node with the above settings
		var newNode : PCGTreeNode = new PCGTreeNode(roomContent, roomGeometry, inDoor, inCorridor, false, geometryBuilder);
		return newNode;
	}
	
	// Prints the tree in a a mixed pre-order/in-order fashion. if the roomID has brackets around it, it means its visiting one of this nodes children
	function RecursivePrintTree(description : String) : String {
		var roomID = PCGGenericRoomManager.GeometryAndSettingsToFullId(geometryID, combinedContentID);
		description = description + "-" + roomID;
		
		for (var j : int in childNodes.Keys) {
			description = description + "-(" + roomID + ")";
			description = childNodes[j].RecursivePrintTree(description);
		}
		
		return description;
	}	
	
	// Evaluates fitness by giving positive score to item pickups and negative score to enemies
	function RecursiveDummyFitness(fitness : float) : float {	
		var dummyRoom : PCGGenericRoomManager = geometryBuilder.dummyRoom;
		dummyRoom.IdToSettings(combinedContentID);
		
		// Fitness is sum of all settings of each room in the map. 
		// Positive score for each pick-up, negative score for each enemy
		fitness = fitness + parseInt(dummyRoom.featureSettings[FEATURES.Ammo]) + parseInt(dummyRoom.featureSettings[FEATURES.Health])
						  + parseInt(dummyRoom.featureSettings[FEATURES.Weapon]) - parseInt(dummyRoom.featureSettings[FEATURES.Spider])
						  - (2*parseInt(dummyRoom.featureSettings[FEATURES.Buzz])) - (3*parseInt(dummyRoom.featureSettings[FEATURES.Mech])); 
		
		return fitness;	
	}	
	
	function RecursiveCountDirectPath() : int {
		if (geometryID == PCGTreeNode.exitRoom)
			return 0; // Start the count going backwards through recursion. Dont include exit room
		
		var count : int = 0;		
		for (var j : int in childNodes.Keys) {
			if (childNodes[j].directPath)
				count = (childNodes[j].RecursiveCountDirectPath()+1); // Add itself and push value back up the recursion call 
		}		
		return count;			
	}
	
	function RecursiveCountTotalNodes(counter : PCGTreeCounterHelper) {
		if (geometryID != PCGTreeNode.exitRoom)
			counter.count++;
				
		for (var j : int in childNodes.Keys) {
			childNodes[j].RecursiveCountTotalNodes(counter); // Add itself and push value back up the recursion call 
		}	
	}	
	
	function RecursiveHighLevelFeatureCompile(candidate : PCGTreeCandidate, previousRoomType : PCGTreeHighLevelFeatures.HL_ROOMTYPE, dummyRoom : PCGGenericRoomManager) {
		var roomType : PCGTreeHighLevelFeatures.HL_ROOMTYPE = candidate.highLevelFeatures.UpdateFeatures(this, previousRoomType, dummyRoom);
				
		for (var j : int in childNodes.Keys) {
			childNodes[j].RecursiveHighLevelFeatureCompile(candidate, roomType, dummyRoom); 
		}	
	}
	
	
	function RecursiveOriginalTreeToStringList(theList : List.<String>, parentIndex : int, parentDoorId : int) {
		var nodeAsString : String = this.combinedContentID + "," + this.geometryID + ","
							+ this.inboundDoor + "," + this.inboundCorridor + ","
							+ this.directPath + ","	+ parentIndex + "," + parentDoorId;
		theList.Add(nodeAsString);	
		parentIndex = theList.Count-1;
		
		// Recursive call to all children
		if (geometryID != exitRoom) {
			for (var i : int = 0; i < geometryBuilder.GetNumDoors(geometryID); i++) {
				if (childNodes.ContainsKey(i)) {
					childNodes[i].RecursiveOriginalTreeToStringList(theList, parentIndex,i);
				}
			}
		}
	}
}

