#pragma strict

enum NODE_CONNECTION_RESULT {Success, NoFreeEdgePorts, IndexOutOfBounds, EdgePortTaken};

class PCGGraphNode {
	// Each node has a unique id for comparing node objects
	static var nextNodeID : int = 0;
	@HideInInspector 
	private var nodeID : int;
	
	// The room template (prefab) of this node 
	// and the profile (script on prefab parent with room stats)
	private var roomTemplate : GameObject;
	private var roomProfile : PCGGraphRoomProfile;

	// Node only stores its edges
	private var edgeList : PCGGraphEdge[];
	private var maxEdges : int;
	private var activeEdges : int;
	
	// index of the direct path edge. Negative 1 means there is no direct path on this node
	private var directPathPort : int;
	
	// Errors for when trying to add an edge
	@HideInInspector
	public var lastConnectionResult = NODE_CONNECTION_RESULT.Success;
	
	
	function InitNode (room : GameObject) {
		nodeID = nextNodeID;
		nextNodeID++;
		roomTemplate = room;
		roomProfile = roomTemplate.GetComponent(PCGGraphRoomProfile);
		maxEdges = roomProfile.numberOfDoors;
		edgeList = new PCGGraphEdge[maxEdges];
		activeEdges = 0;
		
		// Make sure each edge is clear 
		for (var i : int = 0; i < maxEdges; i++) 
			edgeList[i] = null;
			
		directPathPort = -1;
	}
	
	
	// Return false if all the rooms doors have been used
	function AddEdge (newEdge : PCGGraphEdge, edgePort : int, directPath : boolean) : boolean {
		if (activeEdges == maxEdges) {
			lastConnectionResult = NODE_CONNECTION_RESULT.NoFreeEdgePorts;
			return false;
		}
		if (edgePort < 0 || edgePort >= maxEdges){
			lastConnectionResult = NODE_CONNECTION_RESULT.IndexOutOfBounds;
			return false;
		}
		if (edgeList[edgePort] != null){
			lastConnectionResult = NODE_CONNECTION_RESULT.EdgePortTaken;
			return false;
		}
		
		if (directPath)
			directPathPort = edgePort;
				
		// Each index in edgeList corresponds to a specific door so we must decide which door to use
		// The index of edgeList matches up to the index of the DoorManager door array of this template.
		edgeList[edgePort] = newEdge;		
		activeEdges++;
		lastConnectionResult = NODE_CONNECTION_RESULT.Success;
		return true;
	}
	
	
	// Return false if edge cannot be found
	function RemoveEdgeByID (edge : PCGGraphEdge) : boolean {
		for (var i : int = 0; i < maxEdges; i++) {
			if (edgeList[i] != null) {
				if (edgeList[i].GetID() == edge.GetID()) {
					var otherNode : PCGGraphNode = edgeList[i].GetOtherNode(this);					
					edgeList[i] = null;
					activeEdges--;
					otherNode.RemoveEdgeByID(edge);
					return true;
				}
			}
		}
		
		return false;		
	}
	
	function RemoveEdgeByPort (edgePort : int) : boolean {
		if (edgeList[edgePort] != null) {
			var otherNode : PCGGraphNode = edgeList[edgePort].GetOtherNode(this);			
			edgeList[edgePort] = null;			
			activeEdges--;
			otherNode.RemoveEdgeByPort(edgePort);
			return true;
		}		
		
		return false;		
	}
	
	function RandomFreePort () : int {
		var tempArray = new int[maxEdges - activeEdges];
		var j : int = 0;
		for (var i : int = 0; i < maxEdges; i++) {
			if (edgeList[i] == null) {
				tempArray[j] = i;
				j++;
			}
		}
		
		return tempArray[Random.Range(0,tempArray.length)];
	}
	
	
	// Recursively traverse the graph and add edge descriptions to a string
	function TraversalString (parentID : int) {
		for (var i : int = 0; i < maxEdges; i++) {
			if (edgeList[i] != null) {
				var otherNode : PCGGraphNode = edgeList[i].GetOtherNode(this);
				// Dont recursively call parent again
				if (otherNode.GetID() != parentID) {
					Debug.Log(" " + nodeID + "-" + edgeList[i].GetEdgeType() + "-" + otherNode.GetID() + ", ");
					otherNode.TraversalString(nodeID);
				}
			}
		}
	}
	
	
	function GetEdgeList () : PCGGraphEdge[] {
		return edgeList;
	}
	
	function GetMaxEdges () : int {
		return maxEdges;
	}
	
	function GetActiveEdges () : int {
		return activeEdges;
	}
	
	function GetDirectPathPort () : int {
		return directPathPort;
	}
	
	function GetID () : int {
		return nodeID;
	}
	
	function GetRoomTemplate() : GameObject {
		return roomTemplate;
	}
}