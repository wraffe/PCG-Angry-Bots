#pragma strict

private var currentLog : System.Text.StringBuilder;
private var entryCount : int;

private var featureStats : int[];
private var featureTotals : int[];
private var weaponsPickedup : int;
private var roomsVisited : int;
private var roomsTotal : int;
private var mapCompleted : boolean;
private var mapType : PCG_METHOD;
private var playTimeStart : float;
private var numRestarts : int;

private var featureTotalLock : boolean; 

function Awake() {
	currentLog = new System.Text.StringBuilder("");
	entryCount = 0;
	featureStats = [0,0,0,0,0,0];
	featureTotals = [0,0,0,0,0,0];
	weaponsPickedup = 0;
	roomsVisited = 0;
	roomsTotal = 0;
	mapCompleted = false;	
	featureTotalLock = false;
	playTimeStart = 1;
	numRestarts = -1;
	mapType = PCG_METHOD.Randomize;
}

/*** Modifiers ***/
function AddEntry(logEntry : String) {		
	entryCount++;
	if (entryCount == 2) {
		featureTotalLock = true;
		playTimeStart = Time.time;		
	}
		
	var countString : String = "";
	if (entryCount < 10)
		countString = "00" + entryCount;
	else if (entryCount >= 10 && entryCount < 100)
		countString = "0" + entryCount;
	else
		countString = "" + entryCount;
		
	if (currentLog.Equals(""))
		currentLog.Append(countString + ":" + logEntry);
	else {
		currentLog.AppendLine();
		currentLog.Append(countString + ":" + logEntry);
	}
}

function IncrementFeatureStat(statID : int) {
	featureStats[statID]++;
}

function IncrementFeatureTotal(statID : int) {
	if (!featureTotalLock)
		featureTotals[statID]++;
}

function DecrementFeatureTotal(statID : int) {
	if (!featureTotalLock)
		featureTotals[statID]--;
}

function WeaponPickedup() {
	weaponsPickedup++;
}

function RoomVisited() {
	roomsVisited++;
}

function MapRestarted() {
	numRestarts++;
}

function SetRoomsTotal(totalCount : int) {
	roomsTotal = totalCount;
}

function SetMapType(type : PCG_METHOD) {
	this.AddEntry("... mapType is " + type.ToString()+"d");
	mapType = type;
}

function MapCompleted() {
	mapCompleted = true;
}


/*** Accessors ***/
function GetLog() : String {
	return currentLog.ToString();
}

function GetStatsString() : String {
	var newString = "---Last run stats---";
	newString = newString + "\nMap Type:" + mapType.ToString() + "d";
	newString = newString + "\nMap Completed:" + mapCompleted.ToString();
	newString = newString + "\nPlay Time Mins:" + ((Time.time - playTimeStart)/60).ToString("F2");
	newString = newString + "\nNum Restarts:" + numRestarts;
	if (mapCompleted)
		newString = newString + "\nRooms Visited:" + (roomsVisited-1) + "/" + roomsTotal; // Dont include exit
	else
		newString = newString + "\nRooms Visited:" + roomsVisited + "/" + roomsTotal;
	newString = newString + "\nSpiders Killed:" + featureStats[FEATURES.Spider] + "/" + featureTotals[FEATURES.Spider];
	newString = newString + "\nBuzzBots Killed:" + featureStats[FEATURES.Buzz] + "/" + featureTotals[FEATURES.Buzz];
	newString = newString + "\nMechs Killed:" + featureStats[FEATURES.Mech] + "/" + featureTotals[FEATURES.Mech];
	newString = newString + "\nAmmo Pickedup:" + featureStats[FEATURES.Ammo] + "/" + featureTotals[FEATURES.Ammo];
	newString = newString + "\nHealth Pickedup:" + featureStats[FEATURES.Health] + "/" + featureTotals[FEATURES.Health];
	newString = newString + "\nWeapons Examined:" + featureStats[FEATURES.Weapon] + "/" + featureTotals[FEATURES.Weapon];
	newString = newString + "\nWeapons Pickedup:" + weaponsPickedup;
	return newString;
}

function GetMapCompleted() : boolean {
	return mapCompleted;
}

function GetRoomsVisited() : int {
	return roomsVisited;
}

function GetFeatureStats() : int[] {
	return featureStats;
}

function GetFeatureTotals() : int[] {
	return featureTotals;
}

function GetWeaponsPickedup() : int {
	return weaponsPickedup;
}

/*** Resets ***/
function ResetLog() {
	currentLog = new System.Text.StringBuilder("");
	entryCount = 0;
	mapCompleted = false;
	roomsTotal = 0;
	featureTotals = [0,0,0,0,0,0];
	featureTotalLock = false;
	playTimeStart = 1;
	numRestarts = -1;
	ResetStats();
}

function ResetStats() {
	featureStats = [0,0,0,0,0,0];
	weaponsPickedup = 0;
	roomsVisited = 0;
}
