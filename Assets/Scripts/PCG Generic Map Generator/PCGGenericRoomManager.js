#pragma strict

enum FEATURES {Spider, Buzz, Mech, Health, Ammo, Weapon}
enum SETTINGS {None, Low, Med, High}

@HideInInspector
public static var numFeatures : int = System.Enum.GetValues(FEATURES).Length;
@HideInInspector
public static var numSettings : int = System.Enum.GetValues(SETTINGS).Length;
// The max number of doors that a room can have. 
// Figure is based on the templates we currently have.
// This is also the max number of connections a node can have. 
// maxDoors-1 is the max children a node can have
@HideInInspector
public static var maxDoors : int = 4; 

@HideInInspector
public var geometryBuilder : PCGGenericGeometryBuilder;

public var doorAnchors : Transform[];
public var doorPuzzles : PCGPuzzle[];

@HideInInspector
public var treeDepth : int = -2;
@HideInInspector
public var treeSibling : int = -2;

public var spiderGroups : Transform[] = new Transform[numSettings];
public var buzzGroups : Transform[] = new Transform[numSettings];
public var mechGroups : Transform[] = new Transform[numSettings];
public var healthGroups : Transform[] = new Transform[numSettings];
public var ammoGroups : Transform[] = new Transform[numSettings];
public var weaponGroups : Transform[] = new Transform[numSettings];
//public var puzzleGroups : Transform[] = new Transform[numSettings];
//public var coinGroups : Transform[] = new Transform[numSettings];


@HideInInspector
public var featureSettings : SETTINGS[] = new SETTINGS[numFeatures];

function Awake() {
	geometryBuilder = GameObject.FindWithTag("MapManager").GetComponent(PCGGenericGeometryBuilder);
	
	for (var i : int = 0; i < doorPuzzles.Length; i++)
		doorPuzzles[i].doorID = i;
}

function SetTreeID(depth : int, siblingIndex : int) {
	treeDepth = depth;
	treeSibling = siblingIndex;
	for (var i : int = 0; i < doorPuzzles.Length; i++) {
		doorPuzzles[i].doorID = i;
		doorPuzzles[i].treeDepth = depth;
		doorPuzzles[i].treeSibling = siblingIndex;		
	}	
}


//////////// ID Conversions /////////////
function IdToSettings(id : int) {
	for (var i : int = 0; i < numFeatures; i++) {
		var denominator = Mathf.Pow(numSettings,(numFeatures-(i+1)));
		var settingVal : int = Mathf.FloorToInt(id/denominator);
		featureSettings[i] = settingVal;
		if (settingVal != 0)
			id = id % denominator;	
	}
}


function SettingsToId() : int {
	var id : int = 0;	
	for (var i : int = 0; i < numFeatures; i++) {
		id = id + (parseInt(featureSettings[i]) * Mathf.Pow(numSettings,(numFeatures-(i+1))));
	}	
	return id;
}


/* Give a 1 if that setting has been set, or give a 0 if it is hasn't
 * e.g. Spider[none] has an instance in this room so it gets a 1, 
 * where as Spider[low/med/high] have not been set to this room
 */
function SettingsToClassifierData() : double[] {
	var vals = new double[numFeatures*numSettings];
	for (var i = 0; i < numFeatures; i++) {
		for (var j = 0; j < numSettings; j++) {
			if (featureSettings[i] == j)
				vals[(i*numSettings)+j] = 1;
			else
				vals[(i*numSettings)+j] = 0;
		}
	}
	return vals;
}

static function FullIdToSettingsId(fullId : int) : int {
	return (fullId - (FullIdToGeometryId(fullId)*Mathf.Pow(numSettings, numFeatures)));
}

static function FullIdToGeometryId(id : int) : int {
	return Mathf.FloorToInt(id / Mathf.Pow(numSettings, numFeatures));
}

static function GeometryAndSettingsToFullId(geomId : int, settingId : int) : int {
	return (settingId + Mathf.FloorToInt(geomId * Mathf.Pow(numSettings, numFeatures)));
}

static function CPPNOutputToSettingsId(output : double[]) : int {
	var settingsID : int = 0;
	// 2 Because output range is from -1 to 1
	var conversionRange : float;
	conversionRange = (2.0f/numSettings);
	
	for (var k : int = 0; k < numFeatures; k++) {
		// I think the output is between -1 and 1 but double check
		if (output[k] < -1 || output[k] > 1)
			Debug.LogError("CPPN Output is out of expected bounds");
		
		// Figure out which setting the output corresponds to 
		var thisSetting : int = 0;
		for (var j : int = -(numSettings/2); j < (numSettings/2); j++) {
			var lower : float = j*conversionRange;
			var upper : float = lower + conversionRange;
			if (upper == 1) // To detect last case
				upper = 1.1;
			//Debug.LogWarning("lower = " + lower + ", upper = " + upper);			
			if ((output[k] >= lower && output[k] < upper)) {
				thisSetting = j+(numSettings/2);
				//Debug.LogError("RoomManager: Feature-" + k + ": CPPN Output = " + output[k] + ", thisSetting = " + thisSetting);
				break;
			}
		}
		
		settingsID = settingsID + (thisSetting * Mathf.Pow(numSettings,(numFeatures-(k+1))));
	}
	
	return settingsID;
}



