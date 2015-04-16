#pragma strict
@script RequireComponent(PCGGraphLevelProfile);

// Level stats
@HideInInspector
var levelProfile : PCGGraphLevelProfile;
@HideInInspector
var geometryBuilder : PCGGraphLevelGeometryBuilder;

// Player prefab
var playerObject : GameObject;

// Room Template Prefabs
var roomTemplatePrefabs : GameObject[];
var corridorTemplatePrefabs : GameObject[];
@HideInInspector
var roomProfiles : PCGGraphRoomProfile[];
@HideInInspector
var templateTable : Hashtable;
@HideInInspector
var corridorTable : Hashtable;

// Starting and end nodes (rooms)
@HideInInspector
var startNode : PCGGraphNode;
@HideInInspector
var endNode : PCGGraphNode;

function Awake() {	
	// Find the level profile script
	levelProfile = GetComponent(PCGGraphLevelProfile);
	// Find the geometry builder script
	geometryBuilder = GetComponent(PCGGraphLevelGeometryBuilder);
	
	// Store prefabs in a Array withing a HashTable within a HashTable for easy referencing and finding of the desired type of room.
	// First layer search for room type, then second layer search for difficulty, third layer for multiple rooms per difficulty
	templateTable = new Hashtable();
	roomProfiles = new PCGGraphRoomProfile[roomTemplatePrefabs.length];
	for (var i = 0; i < roomTemplatePrefabs.length; i++) {
		// Get the room profile for each prefab
		roomProfiles[i] = roomTemplatePrefabs[i].GetComponent(PCGGraphRoomProfile);
		if (!roomProfiles[i]) {
			Debug.LogError("Missing a PCGRoomProfile on object : " + roomTemplatePrefabs[i].name);
		}
		
		var innerTable : Hashtable;		
		if (!templateTable.ContainsKey(roomProfiles[i].roomType))	
			templateTable.Add(roomProfiles[i].roomType, new Hashtable());
		innerTable = templateTable[roomProfiles[i].roomType] as Hashtable;
		
		var innerArray : Array;
		if (!innerTable.ContainsKey(roomProfiles[i].roomDifficulty)) 
			innerTable.Add(roomProfiles[i].roomDifficulty, new Array());
		innerArray = innerTable[roomProfiles[i].roomDifficulty] as Array;
				
		innerArray.Add(roomTemplatePrefabs[i]);
	}
	
	// Do the same with corridors but only one in a single hashtable
	corridorTable = new Hashtable();
	for (var j = 0; j < corridorTemplatePrefabs.length; j++) {
		var corridorProfile : PCGGraphCorridorProfile = corridorTemplatePrefabs[j].GetComponent(PCGGraphCorridorProfile);
		if (!corridorProfile)
			Debug.LogError("Missing a PCGCorridorProfile on Object : " + corridorTemplatePrefabs[j].name);
			
		corridorTable.Add(corridorProfile.edgeType, corridorTemplatePrefabs[j]);
	}
	
	var startRoom : GameObject = GetRoom(ROOM_TEMPLATE_TYPE.Start, ROOM_TEMPLATE_DIFFICULTY.Default);
	var endRoom : GameObject = GetRoom(ROOM_TEMPLATE_TYPE.Finish, ROOM_TEMPLATE_DIFFICULTY.Default);
	
	startNode = new PCGGraphNode();
	endNode = new PCGGraphNode();
	startNode.InitNode(startRoom);
	endNode.InitNode(endRoom);
	
	if (startRoom == null || endRoom == null)
		Debug.LogError("No start or finish room template prefabs. Initialisation failed");

	// Construct the level when the game starts 
	GenerateRandomLevel();
	
	// Build the geometry of the level
	geometryBuilder.BuildLevel(startNode);
	
	// Instanciate the player
	geometryBuilder.PlacePlayer(playerObject.transform);
}

function GenerateRandomLevel () {	
	// Break connection to end node, then build direct path and reinsert end node at end
	startNode.RemoveEdgeByPort(0);
	
	// There will always be one room between start and finish rooms
	var newRoom : GameObject = GetRoom(ROOM_TEMPLATE_TYPE.Default, ROOM_TEMPLATE_DIFFICULTY.Default);
	var newNode = new PCGGraphNode();
	newNode.InitNode(newRoom);
	InsertNode_RandomEdge(startNode, newNode, true);	
	
	var currentNode : PCGGraphNode = newNode;
	// Start at 1 because there is already one room added
	for (var i : int = 1; i < levelProfile.directPathLength; i++) {
		newRoom = GetRoom(ROOM_TEMPLATE_TYPE.Default, ROOM_TEMPLATE_DIFFICULTY.Default);
		newNode = new PCGGraphNode();
		newNode.InitNode(newRoom);
		
		InsertNode_RandomEdge(currentNode, newNode, true);		
		
		currentNode = newNode;
	}
	
	InsertNode_RandomEdge(newNode, endNode, true);
	
	startNode.TraversalString(-1);
}


// Given the room type and difficulty, return a random room that meets that description
function GetRoom (type : ROOM_TEMPLATE_TYPE, difficulty : ROOM_TEMPLATE_DIFFICULTY) : GameObject {
	var innerTable : Hashtable = templateTable[type] as Hashtable;
	if (innerTable == null) {
		Debug.LogError("No matching type");
		return null;
	}
		
	var innerArray : Array = innerTable[difficulty] as Array;
	if (innerArray == null) {
		Debug.LogError("No matching difficulty");
		return null;
	}
	
	if (innerArray.length == 0)
		Debug.LogError("No room entries in inner array");
		
	return innerArray[Random.Range(0,innerArray.length)] as GameObject;
}


// Function for making an edge and connecting two nodes together. If the edge cant be formed, check why
function InsertNode_RandomEdge(existingNode : PCGGraphNode, newNode : PCGGraphNode, directPath : boolean) {
	var edge = new PCGGraphEdge();
	
	var node1Port : int = existingNode.RandomFreePort();
	var node2Port : int = newNode.RandomFreePort();
	
	var edgeType : EDGE_TYPES = PCGGraphEdge.RandomEdgeType();
	var corridor : GameObject = corridorTable[edgeType] as GameObject;	
	
	var success : boolean = edge.ConnectNodes(existingNode,node1Port,newNode,node2Port,corridor,directPath);
	
	if (!success) {
		if (existingNode.lastConnectionResult != NODE_CONNECTION_RESULT.Success) 
			Debug.LogError("Existing node with ID " + existingNode.GetID() + " failed a connection : " + existingNode.lastConnectionResult);
		if (newNode.lastConnectionResult != NODE_CONNECTION_RESULT.Success) 
			Debug.LogError("New node with ID " + newNode.GetID() + " failed a connection : " + newNode.lastConnectionResult);
	}
}