#pragma strict

//Collect a lot then remove some in WEKA to see affect
public class PCGTreeHighLevelFeatures {
	enum HL_ROOMTYPE {NoPreviousRoom, LowELowP, LowEHighP, HighELowP, HighEHighP}
	
	// Direct structure
	var numTotalNodes : int;
	var numDirectPathNodes : int;
	var numBranchingNodes : int;
	
	// Geometry
	var totalRepeatedGeom : int;
	var geomInstanceCounts : int[]; // All values above 1 sumed into totalRepeatedGeom
	
	// Direct Content
	var spiderEnumSum : int;
	var buzzEnumSum : int;
	var mechEnumSum : int;
	var healthEnumSum : int;
	var ammoEnumSum : int;
	var weaponEnumSum : int;
	
	// Content combinations (e.g. "low" if {(spider+buzz+mech) < (high+high+high)/2},
	var LowELowPCount : int; // Number of rooms with low enemies and low pickups
	var LowEHighPCount : int;
	var HighELowPCount : int;
	var HighEHighPCount : int; 
	
	// Content pace (to reduce features, these are bidirectional, e.g. lowlowTolowhigh is the same as lowhighTolowlow
	var LowELowPToLowELowPCount : int; // Number of times a LowELowP room is followed by another LowELowP room
	var LowELowPToLowEHighPCount : int;
	var LowELowPToHighELowPCount : int;
	var LowELowPToHighEHighPCount : int;
	var LowEHighPToLowEHighPCount : int;
	var LowEHighPToHighELowPCount : int;
	var LowEHighPToHighEHighPCount : int;
	var HighELowPToHighELowPCount : int;
	var HighELowPToHighEHighPCount : int;
	var HighEHighPToHighEHighPCount : int;
	 
	// Content pace alt (bidirectional, e.g. LowEToHighE is the same as HighEToLowE 
	//(i.e. "a low enemy room is connected to a high enemy room))
	var LowEToLowECount : int;
	var LowEToHighECount : int;
	var HighEToHighECount : int;
	var LowPToLowPCount : int;
	var LowPToHighPCount : int;
	var HighPToHighPCount : int;
	
	function PCGTreeHighLevelFeatures() {
		numTotalNodes = 0;
		numDirectPathNodes = 0;
		numBranchingNodes = 0;
		
		totalRepeatedGeom = 0;
		geomInstanceCounts = new int[10]; // One for each geometry
		for (var i : int = 0; i < geomInstanceCounts.length; i++)
			geomInstanceCounts[i] = 0;
		
		spiderEnumSum = 0;
		buzzEnumSum = 0;
		mechEnumSum = 0;
		healthEnumSum = 0;
		ammoEnumSum = 0;
		weaponEnumSum = 0;
		
		LowELowPCount = 0; 
		LowEHighPCount = 0;
		HighELowPCount = 0;
		HighEHighPCount = 0; 
		
		LowELowPToLowELowPCount = 0; 
		LowELowPToLowEHighPCount = 0;
		LowELowPToHighELowPCount = 0;
		LowELowPToHighEHighPCount = 0;
		LowEHighPToLowEHighPCount = 0;
		LowEHighPToHighELowPCount = 0;
		LowEHighPToHighEHighPCount = 0;
		HighELowPToHighELowPCount = 0;
		HighELowPToHighEHighPCount = 0;
		HighEHighPToHighEHighPCount = 0;
		 
		LowEToLowECount = 0;
		LowEToHighECount = 0;
		HighEToHighECount = 0;
		LowPToLowPCount = 0;
		LowPToHighPCount = 0;
		HighPToHighPCount = 0;		
	}
	
	
	function GetFeatureString() : String {
		totalRepeatedGeom = 0;
		for (var i : int = 0; i < geomInstanceCounts.length; i++) {
			//Debug.LogWarning("Geom: " + i + ", Instances = " + geomInstanceCounts[i]);
			if (geomInstanceCounts[i] > 0)			
				totalRepeatedGeom = totalRepeatedGeom + geomInstanceCounts[i]-1;
		}
		
		var word = "";
		word = word + numTotalNodes + "," + numDirectPathNodes + "," + numBranchingNodes + "," + totalRepeatedGeom
				+ "," + spiderEnumSum + "," + buzzEnumSum + "," + mechEnumSum + "," + healthEnumSum + "," + ammoEnumSum + "," +	weaponEnumSum
				+ "," + LowELowPCount + "," + LowEHighPCount + "," + HighELowPCount + "," + HighEHighPCount 
				+ "," + LowELowPToLowELowPCount + "," +	LowELowPToLowEHighPCount + "," + LowELowPToHighELowPCount + "," + LowELowPToHighEHighPCount 	
				+ "," + LowEHighPToLowEHighPCount + "," + LowEHighPToHighELowPCount + "," + LowEHighPToHighEHighPCount
				+ "," + HighELowPToHighELowPCount + "," + HighELowPToHighEHighPCount 
				+ "," + HighEHighPToHighEHighPCount 
				+ "," + LowEToLowECount + "," + LowEToHighECount + "," + HighEToHighECount 
				+ "," + LowPToLowPCount + "," + LowPToHighPCount + "," + HighPToHighPCount;
				
		return word;
	}
	
	
	function UpdateFeatures(node : PCGTreeNode, previousRoomType : HL_ROOMTYPE, dummyRoom : PCGGenericRoomManager) : HL_ROOMTYPE {
		if (node.geometryID == PCGTreeNode.exitRoom) 
			return HL_ROOMTYPE.NoPreviousRoom;
			
		// Structure
		numTotalNodes++;
		if (node.directPath)
			numDirectPathNodes++;
		else
			numBranchingNodes++;
		
		// Geometry		
		var geomID : int = node.geometryID;		
		geomInstanceCounts[geomID]++;
		
		// Content
		var settingsID : int = node.combinedContentID;
		dummyRoom.IdToSettings(settingsID);
		spiderEnumSum = spiderEnumSum + dummyRoom.featureSettings[FEATURES.Spider];
		buzzEnumSum = buzzEnumSum + dummyRoom.featureSettings[FEATURES.Buzz];
		mechEnumSum = mechEnumSum + dummyRoom.featureSettings[FEATURES.Mech];
		healthEnumSum = healthEnumSum + dummyRoom.featureSettings[FEATURES.Health];
		ammoEnumSum = ammoEnumSum + dummyRoom.featureSettings[FEATURES.Ammo];
		weaponEnumSum = weaponEnumSum + dummyRoom.featureSettings[FEATURES.Weapon];
		
		// Room Type
		var numE : float = parseInt(dummyRoom.featureSettings[FEATURES.Spider]) + parseInt(dummyRoom.featureSettings[FEATURES.Buzz]) + parseInt(dummyRoom.featureSettings[FEATURES.Mech]);
		var numP : float = parseInt(dummyRoom.featureSettings[FEATURES.Health]) + parseInt(dummyRoom.featureSettings[FEATURES.Ammo]) + parseInt(dummyRoom.featureSettings[FEATURES.Weapon]);
		var avgSetting : float = (parseInt(SETTINGS.High)*3) / 2;
		var roomType : HL_ROOMTYPE = HL_ROOMTYPE.LowELowP;
		if ((numE < avgSetting) && (numP < avgSetting)) { 
			roomType = HL_ROOMTYPE.LowELowP;	
			LowELowPCount++;		
			if (previousRoomType == HL_ROOMTYPE.LowELowP) {
				LowELowPToLowELowPCount++;
				LowEToLowECount++;
				LowPToLowPCount++;
			} else if (previousRoomType == HL_ROOMTYPE.LowEHighP) {
				LowELowPToLowEHighPCount++;
				LowEToLowECount++;
				LowPToHighPCount++;
			} else if (previousRoomType == HL_ROOMTYPE.HighELowP) {
				LowELowPToHighELowPCount++;
				LowEToHighECount++;
				LowPToLowPCount++;		
			} else if (previousRoomType == HL_ROOMTYPE.HighEHighP) {
				LowELowPToHighEHighPCount++;
				LowEToHighECount++;
				LowPToHighPCount++;			
			}
		} else if ((numE < avgSetting) && (numP >= avgSetting)) { 
			roomType = HL_ROOMTYPE.LowEHighP;
			LowEHighPCount++;
			if (previousRoomType == HL_ROOMTYPE.LowELowP) {
				LowELowPToLowEHighPCount++;
				LowEToLowECount++;
				LowPToHighPCount++;
			} else if (previousRoomType == HL_ROOMTYPE.LowEHighP) {
				LowEHighPToLowEHighPCount++;
				LowEToLowECount++;
				HighPToHighPCount++;
			} else if (previousRoomType == HL_ROOMTYPE.HighELowP) {
				LowEHighPToHighELowPCount++;
				LowEToHighECount++;
				LowPToHighPCount++;		
			} else if (previousRoomType == HL_ROOMTYPE.HighEHighP) {
				LowEHighPToHighEHighPCount++;
				LowEToHighECount++;
				HighPToHighPCount++;			
			}
		} else if ((numE >= avgSetting) && (numP < avgSetting)) { 
			roomType = HL_ROOMTYPE.HighELowP;
			HighELowPCount++;
			if (previousRoomType == HL_ROOMTYPE.LowELowP) {
				LowELowPToHighELowPCount++;
				LowEToHighECount++;
				LowPToLowPCount++;
			} else if (previousRoomType == HL_ROOMTYPE.LowEHighP) {
				LowEHighPToHighELowPCount++;
				LowEToHighECount++;
				LowPToHighPCount++;
			} else if (previousRoomType == HL_ROOMTYPE.HighELowP) {
				HighELowPToHighELowPCount++;
				HighEToHighECount++;
				LowPToLowPCount++;		
			} else if (previousRoomType == HL_ROOMTYPE.HighEHighP) {
				HighELowPToHighEHighPCount++;
				HighEToHighECount++;
				LowPToHighPCount++;			
			}
		} else if ((numE >= avgSetting) && (numP >= avgSetting)) { 
			roomType = HL_ROOMTYPE.HighEHighP;
			HighEHighPCount++;
			if (previousRoomType == HL_ROOMTYPE.LowELowP) {
				LowELowPToHighEHighPCount++;
				LowEToHighECount++;
				LowPToHighPCount++;
			} else if (previousRoomType == HL_ROOMTYPE.LowEHighP) {
				LowEHighPToHighEHighPCount++;
				LowEToHighECount++;
				HighPToHighPCount++;
			} else if (previousRoomType == HL_ROOMTYPE.HighELowP) {
				HighELowPToHighEHighPCount++;
				HighEToHighECount++;
				LowPToHighPCount++;		
			} else if (previousRoomType == HL_ROOMTYPE.HighEHighP) {
				HighEHighPToHighEHighPCount++;
				HighEToHighECount++;
				HighPToHighPCount++;			
			}
		}
		
		return roomType;
	}
	
	function PrintFeatures() {
		totalRepeatedGeom = 0;
		for (var i : int = 0; i < geomInstanceCounts.length; i++) {
			if (geomInstanceCounts[i] > 0)
				totalRepeatedGeom = totalRepeatedGeom + geomInstanceCounts[i]-1;
		}
		
		var word = "";
		word = word + "numTotalNodes=" + numTotalNodes + ", numDirectPathNodes=" + numDirectPathNodes + ", numBranchingNodes=" + numBranchingNodes + ", totalRepeatedGeom=" + totalRepeatedGeom
				+ ", spiderEnumSum=" + spiderEnumSum + ", buzzEnumSum=" + buzzEnumSum + ", mechEnumSum=" + mechEnumSum + ", healthEnumSum=" + healthEnumSum + ", ammoEnumSum=" + ammoEnumSum + ", weaponEnumSum" + weaponEnumSum
				+ ", LowELowPCount=" + LowELowPCount + ", LowEHighPCount=" + LowEHighPCount + ", HighELowPCount=" + HighELowPCount + ", HighEHighPCount=" + HighEHighPCount 
				+ ", LowELowPToLowELowPCount=" + LowELowPToLowELowPCount + ", LowELowPToLowEHighPCount=" + LowELowPToLowEHighPCount + ", LowELowPToHighELowPCount=" + LowELowPToHighELowPCount + ", LowELowPToHighEHighPCount=" + LowELowPToHighEHighPCount 	
				+ ", LowEHighPToLowEHighPCount=" + LowEHighPToLowEHighPCount + ", LowEHighPToHighELowPCount=" + LowEHighPToHighELowPCount + ", LowEHighPToHighEHighPCount=" + LowEHighPToHighEHighPCount
				+ ", HighELowPToHighELowPCount=" + HighELowPToHighELowPCount + ", HighELowPToHighEHighPCount=" + HighELowPToHighEHighPCount 
				+ ", HighEHighPToHighEHighPCount=" + HighEHighPToHighEHighPCount 
				+ ", LowEToLowECount=" + LowEToLowECount + ", LowEToHighECount=" + LowEToHighECount + ", HighEToHighECount=" + HighEToHighECount 
				+ ", LowPToLowPCount=" + LowPToLowPCount + ", LowPToHighPCount=" + LowPToHighPCount + ", HighPToHighPCount=" + HighPToHighPCount;
				
		Debug.Log(word);
	}
}