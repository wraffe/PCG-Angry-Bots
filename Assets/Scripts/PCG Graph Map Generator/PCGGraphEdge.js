#pragma strict

class PCGGraphEdge {
	// Unique id for each edge
	static var nextEdgeID : int = 0;
	@HideInInspector
	public var edgeID : int;
	
	// Edge type defines the type of corridor that the edge is. 
	private var corridorTemplate : GameObject;
	private var corridorProfile : PCGGraphCorridorProfile;
	
	private var nodeList  = new PCGGraphNode[2];
	
	function ConnectNodes (node1 : PCGGraphNode, node1EdgePort : int, node2 : PCGGraphNode, node2EdgePort : int, corridorObject : GameObject, directPath : boolean) : boolean {
		// If one of these fails, the calling function should check the nodes' lastConnectionResult 
		// to see which one failed and why
		if (!node1.AddEdge(this, node1EdgePort, directPath))
			return false;
		if (!node2.AddEdge(this, node2EdgePort, directPath)) {
			node1.RemoveEdgeByID(this);
			return false;
		}		
		
		edgeID = nextEdgeID;
		nextEdgeID++;
		
		nodeList[0] = node1;
		nodeList[1] = node2;
		
		corridorTemplate = corridorObject;
		corridorProfile = corridorTemplate.GetComponent(PCGGraphCorridorProfile);
		
		return true;		
	}
	
	function GetNode (nodeIndex : int) : PCGGraphNode {
		if (nodeIndex < 0 || nodeIndex >= 2)
			return null;
			
		return nodeList[0];
	}
	
	function GetOtherNode (selectedNode : PCGGraphNode) : PCGGraphNode {
		if (nodeList[0].GetID() == selectedNode.GetID())
			return nodeList[1];
		else if (nodeList[1].GetID() == selectedNode.GetID())
			return nodeList[0];
		else
			return null;
	}
	
	function GetID () : int {
		return edgeID;
	}
	
	function ChangeEdgeType (newCorridor : GameObject) {
		corridorTemplate = newCorridor;
		corridorProfile = corridorTemplate.GetComponent(PCGGraphCorridorProfile);
	}
	
	function ReverseEdgeType () {
		var temp = nodeList[0];
		nodeList[0] = nodeList[1];
		nodeList[1] = temp;
	}
	
	function GetEdgeType () : EDGE_TYPES {
		return corridorProfile.edgeType;
	}
	
	function GetCorridorTemplate () : GameObject {
		return corridorTemplate;
	}
	
	static function RandomEdgeType () : EDGE_TYPES {
		return (Random.Range(0, (EDGE_TYPES.GetValues(typeof(EDGE_TYPES))).Length));
	}
}