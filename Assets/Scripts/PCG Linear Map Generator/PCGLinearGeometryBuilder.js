#pragma strict

class PCGLinearGeometryBuilder extends PCGGenericGeometryBuilder {
	////////////////// Map Builders ///////////////////
	/* Used to validate the map boundaries to make sure no overlap occure in the map.
	 * Only instantiates boundary colliders, not entire room and content
	 */
	function ValidateMap(candidate : List.<PCGLinearGene>) {
		mapParent = new GameObject("MapParent");
		validMap = true;
		mapChecked = false;
		
		var startRoomM : PCGGenericRoomManager = Instantiate(startRoomPrefab,Vector3(0,0,0), Quaternion.identity);
		
		var corrPrefab : PCGGenericRoomManager = corridorPrefabs[candidate[0].corridorID];
		var corrM : PCGGenericRoomManager = Instantiate(corrPrefab,Vector3(0,0,0), Quaternion.identity);
		
		// First gene is just a corridor and nothing else. 
		// Connect first door of corridor to start room
		ConnectAnchors(startRoomM.transform, corrM.transform, startRoomM.doorAnchors[0], corrM.doorAnchors[0]);
		startRoomM.transform.parent = mapParent.transform; //Parent rooms for easy removal later
		
		for (var i : int = 1; i < candidate.Count; i++) {
			var geometryID : int = PCGGenericRoomManager.FullIdToGeometryId(candidate[i].roomID);
			var currentRoomPrefab : PCGGenericRoomManager = roomPrefabs[geometryID];
			var roomM : PCGGenericRoomManager = Instantiate(currentRoomPrefab,Vector3(0,0,0), Quaternion.identity);
			
			/* Use previous corridor before loading current one. 
			 * Always use corridor doors in order (i.e. corridor is never reversed, 
			 * hence why so many BentUneven corridor prefabs).	
			 */
			ConnectAnchors(corrM.transform, roomM.transform, corrM.doorAnchors[1], roomM.doorAnchors[candidate[i].inDoor]);
			
			corrM.transform.parent = mapParent.transform; //Parent rooms for easy removal later
			
			// Load current corridor
			corrPrefab = corridorPrefabs[candidate[i].corridorID];
			corrM = Instantiate(corrPrefab,Vector3(0,0,0), Quaternion.identity);
			
			// Connect current corridor to current room
			ConnectAnchors(roomM.transform, corrM.transform, roomM.doorAnchors[candidate[i].outDoor], corrM.doorAnchors[0]);		
	
			roomM.transform.parent = mapParent.transform; //Parent rooms for easy removal later
		}
		
		// Connect end room to last corridor
		var endRoomM : PCGGenericRoomManager = Instantiate(startRoomPrefab,Vector3(0,0,0), Quaternion.identity);
		ConnectAnchors(corrM.transform, endRoomM.transform, corrM.doorAnchors[1], endRoomM.doorAnchors[0]);
		corrM.transform.parent = mapParent.transform; //Parent rooms for easy removal later
		endRoomM.transform.parent = mapParent.transform; //Parent rooms for easy removal later
		
		// Yield for two frames to allow PCGLinearCollisionReportScripts to function
		yield;
		yield;
		yield;
		while (!mapChecked) {
			Debug.Log("Map not checked yet");
			yield;		
		}
		
		DestroyLastMap();	
	}
	
	
	/* Builds the full geometry of the map. Code is similar to ValidateMap,
	 * however, structure was optimized for performance during ValidateMap 
	 * because it is potentially done very often. BuildMap only called when
	 * player wants to play a candidate (not too often), thus the code here
	 * is not as clean and uses expensive operations such as Find.  
	 */
	function BuildMap(candidate : List.<PCGLinearGene>) {
		mapParent = new GameObject("MapParent");
		var startRoomT : Transform = Instantiate(startRoomPrefab.transform.parent,Vector3(0,0,0), Quaternion.identity);	
		var startRoomM : PCGGenericRoomManager = startRoomT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
		Destroy(startRoomM.transform.Find("RoomBoundaries").gameObject); // RoomBoundaries destroyed to lessen collision detection during runtime
		currentStartRoom = startRoomM;
		PlacePlayer();
		
		var corrPrefab : PCGGenericRoomManager = corridorPrefabs[candidate[0].corridorID];
		var corrT : Transform = Instantiate(corrPrefab.transform.parent,Vector3(0,0,0), Quaternion.identity);	
		var corrM : PCGGenericRoomManager = corrT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
		Destroy(corrM.transform.Find("RoomBoundaries").gameObject);
		
		ConnectAnchors(startRoomT, corrT, startRoomM.doorAnchors[0], corrM.doorAnchors[0]);
		startRoomT.parent = mapParent.transform; 
		
		for (var i : int = 1; i < candidate.Count; i++) {
			var geometryID : int = PCGGenericRoomManager.FullIdToGeometryId(candidate[i].roomID);		
			var currentRoomPrefab : PCGGenericRoomManager = roomPrefabs[geometryID];
			var roomT : Transform = Instantiate(currentRoomPrefab.transform.parent,Vector3(0,0,0), Quaternion.identity);	
			var roomM : PCGGenericRoomManager = roomT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
			Destroy(roomM.transform.Find("RoomBoundaries").gameObject); 
			SetContent(candidate[i].roomID,roomM);
				
			ConnectAnchors(corrT, roomT, corrM.doorAnchors[1], roomM.doorAnchors[candidate[i].inDoor]);		
			corrT.parent = mapParent.transform; 
	
			corrPrefab = corridorPrefabs[candidate[i].corridorID];
			corrT = Instantiate(corrPrefab.transform.parent,Vector3(0,0,0), Quaternion.identity);	
			corrM = corrT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
			Destroy(corrM.transform.Find("RoomBoundaries").gameObject);
			
			ConnectAnchors(roomT, corrT, roomM.doorAnchors[candidate[i].outDoor], corrM.doorAnchors[0]);		
			roomT.parent = mapParent.transform; 
		}
		
		var endRoomT : Transform = Instantiate(endRoomPrefab.transform.parent,Vector3(0,0,0), Quaternion.identity);	
		var endRoomM : PCGGenericRoomManager = endRoomT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
		Destroy(endRoomM.transform.Find("RoomBoundaries").gameObject);	
		
		ConnectAnchors(corrT, endRoomT, corrM.doorAnchors[1], endRoomM.doorAnchors[0]);	
		
		corrT.parent = mapParent.transform; 
		endRoomT.parent = mapParent.transform; 
	}
}