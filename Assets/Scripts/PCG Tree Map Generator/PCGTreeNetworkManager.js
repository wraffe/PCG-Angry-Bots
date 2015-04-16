#pragma strict

@HideInInspector
var currentPlayerID : String = "";
@HideInInspector	
var lastMsg : String = "";

static var msg_success : String = "Success";
static var msg_idExists : String = "IdExists";
static var msg_loginFail : String = "LoginFail";
static var msg_noFile : String = "NoFile";

// Addresses
private var addr_newUser : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-NewUser.cgi";
private var addr_login : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-ConfirmLogin.cgi";
private var addr_checkHoldID : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-CheckAndHoldID.cgi";
private var addr_releaseID : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-ReleaseID.cgi";
private var addr_writeFeatureData : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-WriteFeatureData.cgi";
private var addr_writeNEATData : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-WriteNEATData.cgi";
private var addr_writeGeometryData : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-WriteGeometryData.cgi";
private var addr_writeLogData : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-WriteLogAndStatsData.cgi";
private var addr_fetchFeatureData : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchFeatureData.cgi";
private var addr_fetchNEATData : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchNEATData.cgi";
private var addr_fetchGeometryData : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchGeometryData.cgi";
private var addr_fetchArchiveGeometryData : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchArchiveGeometryData.cgi";
private var addr_fetchStatsData : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchStatsData.cgi";
private var addr_fetchLeaderboardData : String = "goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchLeaderboardData.cgi";

function Awake() {
	DontDestroyOnLoad(transform.gameObject);
	// Web player must have http:// at the start to match the webplayers Application.absoluteURL and avoid a crossDomain policy file
	// However, in the standalone, adding http:\\ causes it to search for a crossDomain policay file (this is strange?), hence the above
	if (Application.isWebPlayer) {
		addr_newUser = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-NewUser.cgi";
		addr_login  = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-ConfirmLogin.cgi";
		addr_checkHoldID  = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-CheckAndHoldID.cgi";
		addr_releaseID  = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-ReleaseID.cgi";
		addr_writeFeatureData = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-WriteFeatureData.cgi";
		addr_writeNEATData = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-WriteNEATData.cgi";
		addr_writeGeometryData = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-WriteGeometryData.cgi";
		addr_writeLogData = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-WriteLogAndStatsData.cgi";
		addr_fetchFeatureData = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchFeatureData.cgi";
		addr_fetchNEATData = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchNEATData.cgi";
		addr_fetchGeometryData = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchGeometryData.cgi";
		addr_fetchArchiveGeometryData = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchArchiveGeometryData.cgi";
		addr_fetchStatsData = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchStatsData.cgi";
		addr_fetchLeaderboardData = "http://goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchLeaderboardData.cgi";
	}
}

function NewUser(playerID : String, password : String) {
	lastMsg = "";
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	form.AddField("password",password);
	
	var reply = new WWW(addr_newUser,form);
	yield(reply);	
	SetLastMessage(reply);
}


function ConfirmLogin(playerID : String, password : String) {
	lastMsg = "";
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	form.AddField("password",password);
	
	var reply = new WWW(addr_login,form);
	yield(reply);	
	SetLastMessage(reply);
Debug.LogWarning("Confirm Login: " + reply.text);
}


function CheckAndHoldID(playerID : String) {
	lastMsg = "";
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	
	var reply = new WWW(addr_checkHoldID,form);	
	yield(reply);	
	SetLastMessage(reply);
}


function ReleaseID(playerID : String) {
	lastMsg = "";
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	
	var reply = new WWW(addr_releaseID,form);
	yield(reply);	
	SetLastMessage(reply);
}


function WriteFeatureData(playerID : String, newData : String) {
	lastMsg = "";	
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	form.AddField("data",newData);
	
	var reply = new WWW(addr_writeFeatureData,form);
	yield(reply);	
	SetLastMessage(reply);
Debug.LogWarning("Write Feature: " + reply.text);
}


function WriteNEATData(playerID : String, newData : String) {
	lastMsg = "";	
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	form.AddField("data",newData);
	
	var reply = new WWW(addr_writeNEATData,form);
	yield(reply);	
	SetLastMessage(reply);
Debug.LogWarning("Write NEAT: " + reply.text);
}


function WriteGeometryData(playerID : String, newData : String) {
	lastMsg = "";	
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	form.AddField("data",newData);
	
	var reply = new WWW(addr_writeGeometryData,form);
	yield(reply);	
	SetLastMessage(reply);
Debug.LogWarning("Write Geometry: " + reply.text);
}


function WriteLogAndStatsData(playerID : String, logString : String, geomString : String, 
								statString : String, mapCompleted : boolean,
								roomsExplored : int, featureStats : int[], weaponPickups : int) {
	lastMsg = "";	
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	form.AddField("logString",logString);
	form.AddField("geomString",geomString);
	form.AddField("statString",statString);
	if (mapCompleted)
		form.AddField("mapCompleted","true");
	else 
		form.AddField("mapCompleted","false");
	form.AddField("numRoomsExplored",roomsExplored);
	form.AddField("numSpiderKills",featureStats[FEATURES.Spider]);
	form.AddField("numBuzzKills",featureStats[FEATURES.Buzz]);
	form.AddField("numMechKills",featureStats[FEATURES.Mech]);
	form.AddField("numAmmoPickups",featureStats[FEATURES.Ammo]);
	form.AddField("numHealthPickups",featureStats[FEATURES.Health]);
	form.AddField("numWeaponExamins",featureStats[FEATURES.Weapon]);
	form.AddField("numWeaponPickups",weaponPickups);
	
	var reply = new WWW(addr_writeLogData,form);
	yield(reply);	
	SetLastMessage(reply);
Debug.LogWarning("Write Log: " + reply.text);
}


function FetchFeatureData(playerID : String) {
	lastMsg = "";
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	
	var reply = new WWW(addr_fetchFeatureData,form);
	yield(reply);	
	SetLastMessage(reply);
}


function FetchNEATData(playerID : String) {
	lastMsg = "";
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	
	var reply = new WWW(addr_fetchNEATData,form);
	yield(reply);	
	SetLastMessage(reply);
}


function FetchGeometryData(playerID : String) {
	lastMsg = "";
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	
	var reply = new WWW(addr_fetchGeometryData,form);
	yield(reply);	
	SetLastMessage(reply);
}

function FetchArchiveGeometryData(playerID : String, mapID : int) {
	lastMsg = "";
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	form.AddField("mapID",mapID);
	
	var reply = new WWW(addr_fetchArchiveGeometryData,form);
	yield(reply);	
	SetLastMessage(reply);
}

function FetchStatsData(playerID : String) {
	lastMsg = "";
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	
	var reply = new WWW(addr_fetchStatsData,form);
	yield(reply);	
	SetLastMessage(reply);
}

function FetchLeaderboardData(playerID : String) {
	lastMsg = "";
	var form = new WWWForm();
	form.AddField("playerID",playerID);
	
	var reply = new WWW(addr_fetchLeaderboardData,form);
	yield(reply);	
	SetLastMessage(reply);
}

//////////// UTILITIES /////////////////////
function SetLastMessage(reply : WWW) {
	if (reply.text == null)	
		lastMsg = ("Critical Network Error: No text in reply from server");
	else
		lastMsg = reply.text;
			
	if (reply.error) 
		lastMsg = ("Critical Network Error: " + reply.error);
}


function CompileDataString(candidate : PCGTreeCandidate, rating : String, dummyRoom : PCGGenericRoomManager) : String {
	candidate.FillAdjacencyMatrix();	
	var connectionVector : int[] = candidate.GetConnectivityVector();	
	var contentVector : int[] = candidate.GetContentVector(dummyRoom);
	
	var dataString : String = "";
	
	for (var j : int = 0; j < connectionVector.length; j++) {
		dataString = dataString+connectionVector[j]+",";
	}
	for (j = 0; j < contentVector.length; j++) {
		dataString = dataString+contentVector[j]+",";
	}
	dataString = dataString+rating;
	
	return dataString;
}

function CompileAltDataString(candidate : PCGTreeCandidate, rating : String, dummyRoom : PCGGenericRoomManager) : String {
	var dataString : String = candidate.GetHighLevelFeatureString(dummyRoom);
	dataString = dataString + "," + rating;
	return dataString;
}

static function RandomID() : String {
	var intID : int = Random.Range(1,9999);
	var stringID : String = "";
	
	if (intID < 10)
		stringID = "000"+intID;
	if (intID >= 10 && intID < 100)
		stringID = "00"+intID;	
	if (intID >= 100 && intID < 1000)
		stringID = "0"+intID;
	if (intID >= 1000)
		stringID = ""+intID;
		
	return stringID;		
}

static function RandomPassword() : String {
	var password : String = "";
    for (var i : int = 0; i < 6; i++) {
    	var asciiInt : int;
    	var asciiSection : float = Random.value;
    	// Integers
    	if (asciiSection <= (1.0f/3.0f))
    		asciiInt = Random.Range(48,58);
    	// Captial letters
    	else if (asciiSection > (1.0f/3.0f) && asciiSection <= (2.0f/3.0f))
    		asciiInt = Random.Range(65,91);
    	//Lower case letters
    	else
    		asciiInt = Random.Range(97,123);
    		
    	password = password+(System.Convert.ToChar(asciiInt)).ToString();
    }
    return password;
}

