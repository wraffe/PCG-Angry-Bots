#pragma strict

class PCGGenericGeometryBuilder extends MonoBehaviour {
 
	public var playerTransform : Transform;
	public var startRoomPrefab : PCGGenericRoomManager;
	public var endRoomPrefab : PCGGenericRoomManager;
	public var roomPrefabs : PCGGenericRoomManager[];
	public var corridorPrefabs : PCGGenericRoomManager[];
	
	@HideInInspector
	public var numRoomGeom : int;
	@HideInInspector
	public var numRoomSettings : int;
	@HideInInspector
	public var numCorrGeom : int;
	
	public var currentStartRoom : PCGGenericRoomManager;
	
	@HideInInspector
	public var validMap : boolean;
	@HideInInspector
	public var mapChecked : boolean;
	
	@HideInInspector
	public var mapParent : GameObject;
	
	
	function Awake() {
		validMap = true;
		numRoomGeom = roomPrefabs.length;
		numRoomSettings = Mathf.Pow(PCGGenericRoomManager.numSettings, PCGGenericRoomManager.numFeatures);
		numCorrGeom = corridorPrefabs.length;
	}
	
	/* Go through each feature group for a map and destroy the gameobjects that arent needed */
	function SetContent(contentId : int, roomM : PCGGenericRoomManager) {
		roomM.IdToSettings(contentId);
		
		// SPIDERS
		for (var i : int = roomM.featureSettings[FEATURES.Spider]+1; i < PCGGenericRoomManager.numSettings; i++) {
			try {
				Destroy(roomM.spiderGroups[i].gameObject);
			} catch (err) {
				Debug.LogWarning("A Spider Group entry has not been assigned");
			}
		}
		
		// BUZZBOTS
		for (i = roomM.featureSettings[FEATURES.Buzz]+1; i < PCGGenericRoomManager.numSettings; i++) {
			try {
				Destroy(roomM.buzzGroups[i].gameObject);
			} catch (err) {
				Debug.LogWarning("A Buzz Group entry has not been assigned");
			}
		}
		
		// MECHS
		for (i = roomM.featureSettings[FEATURES.Mech]+1; i < PCGGenericRoomManager.numSettings; i++) {
			try {
				Destroy(roomM.mechGroups[i].gameObject);
			} catch (err) {
				Debug.LogWarning("A Mech Group entry has not been assigned");
			}
		}
		
		// AMMO
		for (i = roomM.featureSettings[FEATURES.Ammo]+1; i < PCGGenericRoomManager.numSettings; i++) {;
			try {
				Destroy(roomM.ammoGroups[i].gameObject);
			} catch (err) {
				Debug.LogWarning("A Ammo Group entry has not been assigned");
			}
		}
		
		// HEALTH
		for (i = roomM.featureSettings[FEATURES.Health]+1; i < PCGGenericRoomManager.numSettings; i++) {
			try {
				Destroy(roomM.healthGroups[i].gameObject);
			} catch (err) {
				Debug.LogWarning("A Health Group entry has not been assigned");
			}
		}
		
		// WEAPONS
		for (i = roomM.featureSettings[FEATURES.Weapon]+1; i < PCGGenericRoomManager.numSettings; i++) {
			try {
				Destroy(roomM.weaponGroups[i].gameObject);
			} catch (err) {
				Debug.LogWarning("A Weapon Group entry has not been assigned" + roomM.transform.parent.name);
			}
		}
	}
	
	/////////////////// Utilities ////////////////
	function GetNumDoors(prefabIndex : int) : int {
		if (prefabIndex < 0 || prefabIndex > roomPrefabs.Length)
		{ 
			Debug.LogError("Prefab index out of bounds in PCGLinearGeometryBuilder.GetNumDoors(). Index is: " + prefabIndex);
			return 0;
		}
		
		//return the length of the doorAnchor array of the apporopriate PCGGenericRoomManager	
		return roomPrefabs[prefabIndex].doorAnchors.length;
	}
	
	function PlacePlayer() {
		var playerSpawn = currentStartRoom.GetComponent(PCGPlayerSpawn);
		
		// Get the spawn point transform
		if (!playerSpawn)
			Debug.LogError("Player object trying to be placed in a room without a PCGPlayerSpawn component");
		else {		
			//Reset ammo and health
			playerTransform.gameObject.SetActiveRecursively(true);
			playerTransform.gameObject.GetComponent(PCGGameHUD).enabled = true;
			playerTransform.gameObject.GetComponentInChildren(PCGPlayerAmmo).ResetAmmo();
			var playerHealth = playerTransform.gameObject.GetComponent(Health);
			playerHealth.health = playerHealth.maxHealth;;
			playerTransform.position = playerSpawn.playerSpawnPoint.position;
			var weapon : PCGPlayerAutoFire = playerTransform.gameObject.GetComponentInChildren(PCGPlayerAutoFire);
			weapon.rateOfFire = 10;
			weapon.damagePerShot = 2;
			weapon.forcePerShot = 2;
			Input.ResetInputAxes();	
			weapon.OnStopFire();	
		}			
	}
	
	function DisablePlayer() {
		playerTransform.gameObject.GetComponent(PCGGameHUD).enabled = false;
		playerTransform.gameObject.SetActiveRecursively(false);
		Input.ResetInputAxes();
	}	
	
	function DestroyLastMap() {
		if (mapParent != null)
			Destroy(mapParent);
		if (playerTransform != null) {
			if (playerTransform.gameObject.active == true) 
				DisablePlayer();
		}
		
		// To delete all spider clones and their ActiveRadius
		for(var clone : GameObject in GameObject.FindGameObjectsWithTag("ToDestroy"))
			Destroy(clone);   
		
	}
	
	////////////////// Door Locks ///////////////
	function ResetDoorLocks(roomM : PCGGenericRoomManager) {
		for (var i : int = 0; i < roomM.doorPuzzles.Length; i++) {
			if (roomM.doorPuzzles[i] != null) {
				roomM.doorPuzzles[i].permaLocked = true;
				roomM.doorPuzzles[i].puzzleLocked = false;
			}
		}
	}
	
	function UnPermaLockDoor(roomM :PCGGenericRoomManager, doorId : int) {
		if (roomM.doorPuzzles[doorId] != null)
			roomM.doorPuzzles[doorId].permaLocked = false;
	}
	
	///////////////// Anchors //////////////////
	
	function ConnectAnchors (room1 : Transform, room2 : Transform, room1Anchor : Transform, room2Anchor : Transform) {
		// In order to make the room a child of the anchor (so that it move with the anchor)
		// we must first stop the anchor from being a child of the room
		room2Anchor.parent = null;
		room2.parent = room2Anchor;
		room2Anchor.position = room1Anchor.position;
		room2Anchor.Translate(room1Anchor.forward*5, Space.World);
		room2Anchor.LookAt(room1Anchor);
		room2Anchor.position = room1Anchor.position;		
		
		// Re-instate original parent-child relationship
		room2.parent = null;
		room2Anchor.parent = room2;
	}
}