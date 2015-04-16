#pragma strict

class PCGTreeGeometryBuilder extends PCGGenericGeometryBuilder {
	var dummyRoom : PCGGenericRoomManager;
	
	@HideInInspector
	public var randomSibIndex : boolean = false;
	
	private var yieldLimit : int = 50;
	
	function ValidateMap(candidate : PCGTreeCandidate) : IEnumerator {
		// Check the size of the map to start with, if its too big or too small, dispose it immediately
		if (gameObject.GetComponent(PCGTreeMapManager)!=null) {
			var countHelper = new PCGTreeCounterHelper();
			candidate.rootNode.RecursiveCountTotalNodes(countHelper);
			candidate.totalNodeCount = countHelper.count;
			if (candidate.totalNodeCount < 2 || candidate.totalNodeCount > candidate.maxNodeCount) {
				validMap = false;
				mapChecked = true;
				return;
			} 
		}
		
		mapParent = new GameObject("MapParent");
		validMap = true;
		mapChecked = false;
		
		var startRoomM : PCGGenericRoomManager = Instantiate(startRoomPrefab,Vector3(0,0,0), Quaternion.identity);
		
		// Get each room to build itself. This is much simpler than a centralized build function
		candidate.rootNode.RecursiveValidate(startRoomM, 0, candidate, mapParent);
		
		startRoomM.transform.parent = mapParent.transform;
		
		// Yield for few frames to allow PCGLinearCollisionReportScripts to function
		yield;
		yield;
		yield;
		var yieldCounter : int = 0;
		while (!mapChecked) {
			yieldCounter++;
			if (yieldCounter >= yieldLimit) {
				Debug.LogWarning("Yield limit reached");
				mapChecked = true;
				validMap = false;
			}
			yield;		
		}
		
		DestroyLastMap();
	}
	
	
	function BuildMap(candidate : PCGTreeCandidate) {
		mapParent = new GameObject("MapParent");
		
		var startRoomT : Transform = Instantiate(startRoomPrefab.transform.parent,Vector3(0,0,0), Quaternion.identity);	
		var startRoomM : PCGGenericRoomManager = startRoomT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
		Destroy(startRoomM.transform.Find("RoomBoundaries").gameObject); // RoomBoundaries destroyed to lessen collision detection during runtime
		currentStartRoom = startRoomM;
		PlacePlayer();
		
		// Get each room to build itself. This is much simpler than a centralized build function
		candidate.rootNode.RecursiveBuild(startRoomT, 0, candidate, mapParent, 0);
		
		startRoomT.parent = mapParent.transform;
		
		
	} 
}