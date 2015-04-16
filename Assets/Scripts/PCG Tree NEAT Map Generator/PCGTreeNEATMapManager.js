#pragma strict
@script RequireComponent(PCGTreeGeometryBuilder)
@script RequireComponent(PCGTreeNEATEvolution)

import System.IO;

enum PCG_STATE {Loading, AwaitingPlayer, ShowStartScreen, ShowTutorial, ShowHighScores, ShowSurvey, ShowExperimentInfo, EvolveGeometry, EvolveContent, SelectMap, PlayMap, RateMap, UpdateClassifier, SendNetworkData, WhatNext, GeomDebug, CPPNDebug}
enum PCG_METHOD {Optimize, Randomize, Defined}

var minNumDirectPathRooms : int = 2;
var maxNumDirectPathRooms : int = 7;
var maxNumRoomsPerCandidate : int = 10;
var fixedNumRooms : int = 3;
var fixedBranchingProbability : float = 0.5;
var fixedBranchingDecay : float = 0.5;
var numSpeedTestMaps : int = 100;

@HideInInspector
public var gameState : PCG_STATE = PCG_STATE.AwaitingPlayer;
@HideInInspector
public var buildMode : PCG_METHOD = PCG_METHOD.Optimize;
@HideInInspector
public var networkManager : PCGTreeNetworkManager;

private var geometryBuilder : PCGTreeGeometryBuilder;
private var evolution : PCGTreeNEATEvolution;
private var playerModel : PCGWekaClassifier;

private var logger : PCGGenericLogger;

public var mapPreviewCapture : PCGCameraCapture;
public var mapPreviewCaptureAlt : PCGCameraCaptureAlt;

/* GUIs */
private var gameStartGUI : PCGGameStartGUI;
private var loadingGUI : PCGLoadingGUI;
private var deathGUI : PCGDeathGUI;
private var ratingGUI : PCGRatingGUI;
private var geomSelectionGUI : PCGGeomSelectionGUI;
private var whatNextGUI : PCGWhatNextGUI;
private var tutorialGUI : PCGTutorialGUI;
private var highscoresGUI : PCGHighscoresGUI;
private var geomDebugGUI : PCGGeomDebugGUI;
public var cppnDebugGUI : PCGCPPNDebugGUI;


function Start () {
Debug.LogWarning("SystemInfo.supportsRenderTextures = " + SystemInfo.supportsRenderTextures.ToString());
	evolution = gameObject.GetComponent(PCGTreeNEATEvolution);
	geometryBuilder = gameObject.GetComponent(PCGTreeGeometryBuilder);
	playerModel = null;
	
	logger = gameObject.GetComponent(PCGGenericLogger);
	if (logger == null)
		Debug.LogWarning("An instance of PCGGenericLogger was not found on a map manager");
	
	gameStartGUI = gameObject.GetComponent(PCGGameStartGUI);
	loadingGUI = gameObject.GetComponent(PCGLoadingGUI);
	deathGUI = gameObject.GetComponent(PCGDeathGUI);
	ratingGUI = gameObject.GetComponent(PCGRatingGUI);
	geomSelectionGUI = gameObject.GetComponent(PCGGeomSelectionGUI);
	whatNextGUI = gameObject.GetComponent(PCGWhatNextGUI);
	tutorialGUI = gameObject.GetComponent(PCGTutorialGUI);
	highscoresGUI = gameObject.GetComponent(PCGHighscoresGUI);
	geomDebugGUI = gameObject.GetComponent(PCGGeomDebugGUI);
	cppnDebugGUI = gameObject.GetComponent(PCGCPPNDebugGUI);
	networkManager = GameObject.FindGameObjectWithTag("NetworkManager").GetComponent(PCGTreeNetworkManager);
	
	gameState = PCG_STATE.Loading;
	loadingGUI.loadMessage = "Fetching Network Data";
	StartCoroutine(FeatchAllNetworkData());
}

function Update() {
	switch(gameState) {
		// If something is loading/processing or if we are waiting on the player to do something,
		// just skip this frame
		case PCG_STATE.Loading:
			if (!loadingGUI.enabled) {
				loadingGUI.loadMessage = " Loading";
				loadingGUI.enabled = true;
			}
			break;
		case PCG_STATE.AwaitingPlayer:
			if (loadingGUI.enabled)
				loadingGUI.enabled = false;
			break;	
		case PCG_STATE.ShowStartScreen:	
			gameStartGUI.enabled = true;
			gameState = PCG_STATE.AwaitingPlayer;
			break;
		case PCG_STATE.ShowTutorial:
			tutorialGUI.enabled = true;
			gameState = PCG_STATE.AwaitingPlayer;
			break;
		case PCG_STATE.ShowHighScores:
			StartCoroutine(ShowHighScoresGUI());
			gameState = PCG_STATE.AwaitingPlayer;
			break;
		case PCG_STATE.ShowSurvey:
			Application.OpenURL("https://rmit.asia.qualtrics.com/SE/?SID=SV_5zrU3zuCZK3Pwmp&userID="+networkManager.currentPlayerID);
			gameState = PCG_STATE.ShowStartScreen;
			break;
		case PCG_STATE.ShowExperimentInfo:
			Application.OpenURL("https://goanna.cs.rmit.edu.au/~wraffe/ExperimentHome.html");
			gameState = PCG_STATE.ShowStartScreen;
			break;
		case PCG_STATE.EvolveGeometry:
			gameState = PCG_STATE.Loading;
			if (logger != null)
				logger.AddEntry("started Map");
			loadingGUI.loadMessage = "Generating Map Geometries";			
			// No population, randomly generate them
			if (evolution.geomPop[0] == null) {
				Debug.Log("STATE: Random Initial Geometry");
				StartCoroutine(evolution.RandomGeomPopulation(fixedNumRooms,fixedBranchingProbability,fixedBranchingDecay,false));	
				logger.SetMapType(PCG_METHOD.Randomize);
				geomSelectionGUI.randomGeneration = true;
			}
			// Otherwise, evolve the population
			else {
				if (buildMode == PCG_METHOD.Optimize) {
					Debug.Log("STATE: Evolve Geometry");
					StartCoroutine(evolution.EvolveGeometry(geomSelectionGUI.lastSelection));
					logger.SetMapType(PCG_METHOD.Optimize);
					geomSelectionGUI.randomGeneration = false;
				}
				// If the user wants to Randomize, skip all Optimize steps
				else {
					logger.SetMapType(PCG_METHOD.Randomize);
					gameState = PCG_STATE.PlayMap;
				}
			}
			break;
		case PCG_STATE.SelectMap:
			Debug.Log("STATE: Select Map");
			gameState = PCG_STATE.Loading;
			StartCoroutine(ShowGeometrySelectionGui()); 
			break;
		case PCG_STATE.EvolveContent:
			Debug.Log("STATE: Evolve Content");		
			gameState = PCG_STATE.Loading;
			loadingGUI.loadMessage = "Generating Map Content";
			StartCoroutine(evolution.EvolveContent(geomSelectionGUI.lastSelection, playerModel));
			break;
		case PCG_STATE.PlayMap:
			gameState = PCG_STATE.Loading;
			// evolution.contentEA.PrintStats();			 
			// SetContentAndBuild will randomly generate Geometry and Content if needed
			if (logger != null) {
				logger.MapRestarted();
				logger.ResetStats();
			}		
			StartCoroutine(evolution.SetContentAndBuild(geomSelectionGUI.lastSelection, buildMode, logger));	
			break;
		case PCG_STATE.RateMap:
			geometryBuilder.DestroyLastMap(); 
			ratingGUI.enabled = true;
			gameState = PCG_STATE.AwaitingPlayer;
			break;
		case PCG_STATE.SendNetworkData:				
			var featureCollector = CollectMapFeatures();
			//****** var featureString = featureCollector.GetFeatureString() + "," + ratingGUI.lastRating;
			/**** Added for multinominal ratings to binary weighted data ****/
			var binRating : double = ((ratingGUI.lastRating-1)/3);
			var weight : double = 0;
			if (ratingGUI.lastRating == 1 || ratingGUI.lastRating == 6)
				weight = 2;
			else if (ratingGUI.lastRating == 2 || ratingGUI.lastRating == 5)
				weight = 1;
			else
				weight = 0.5;
			var featureString = featureCollector.GetFeatureString() + "," + binRating + ",{" + weight + "}";
			var geomString = evolution.CandidateToString(evolution.mapToBuild,'');
			gameState = PCG_STATE.Loading;
			loadingGUI.loadMessage = "Sending Network Data";
			if (buildMode == PCG_METHOD.Randomize) 
				StartCoroutine(SendFeatureNetworkData(featureString, geomString));
			else {
				var neatString = evolution.contentEA.GenomeListToXmlString();								
				StartCoroutine(SendAllNetworkData(featureString, neatString, geomString));
			}			
			break;	
		case PCG_STATE.UpdateClassifier:
			// Using feature collector from SendNetworkData
			if (playerModel != null) {
				featureCollector = CollectMapFeatures();
				playerModel.UpdateClassifier(featureCollector.ToDoubleArray(), ratingGUI.lastRating);
				gameState = PCG_STATE.WhatNext;
			}
			else {
				gameState = PCG_STATE.Loading;
				StartCoroutine(FetchFeatureNetworkData());	
			}	
			break;				
		case PCG_STATE.WhatNext:
			whatNextGUI.enabled = true;
			gameState = PCG_STATE.AwaitingPlayer;
			break;
		case PCG_STATE.GeomDebug:
			geomDebugGUI.enabled = true;
			gameState = PCG_STATE.AwaitingPlayer;
			break;
		case PCG_STATE.CPPNDebug:
			cppnDebugGUI.enabled = true;
			gameState = PCG_STATE.AwaitingPlayer;
			break;
	}
}


function ShowGeometrySelectionGui() {
	if (SystemInfo.supportsRenderTextures) {
		for (var i : int = 0; i < evolution.geomPopSize; i++) {
			// Build the map
			geometryBuilder.BuildMap(evolution.geomPop[i]);
			// yield to let the map render
			yield;			
			// Capture the camera image as a texture
			mapPreviewCapture.CameraToTexture(i,geometryBuilder.mapParent.transform);
			yield;	
			// Destroy map to make room for next one
			geometryBuilder.DestroyLastMap();
		}
	
		gameState = PCG_STATE.AwaitingPlayer;
		geomSelectionGUI.textureArray = mapPreviewCapture.previewTextureArray;
		geomSelectionGUI.enabled = true;
	}
	else {
		for (i = 0; i < evolution.geomPopSize; i++) {
			// Build the map
			geometryBuilder.BuildMap(evolution.geomPop[i]);
			// yield to let the map render
			yield;			
			// Capture the camera image as a texture
			yield StartCoroutine(mapPreviewCaptureAlt.CameraToTexture(i,geometryBuilder.mapParent.transform));
				
			// Destroy map to make room for next one
			geometryBuilder.DestroyLastMap();
		}
	
		Debug.Log("Finished capturing");
		gameState = PCG_STATE.AwaitingPlayer;
		geomSelectionGUI.textureArrayAlt = mapPreviewCaptureAlt.previewTextureArray;
		geomSelectionGUI.enabled = true;
	}
}


function ShowHighScoresGUI() {
	yield StartCoroutine(networkManager.FetchStatsData(networkManager.currentPlayerID));
	if (networkManager.lastMsg.Split("\n"[0]).Length >= 9)
		highscoresGUI.playerScoreString = networkManager.lastMsg;
	else
		Debug.LogError("Error from FetchStatsData: " + networkManager.lastMsg);
	
	yield StartCoroutine(networkManager.FetchLeaderboardData(networkManager.currentPlayerID));
	if (networkManager.lastMsg.Split("\n"[0]).Length >= 9)
		highscoresGUI.highScoreString = networkManager.lastMsg;
	else
		Debug.LogError("Error from FetchLeaderboardData: " + networkManager.lastMsg);	
	
	highscoresGUI.enabled = true;
}


function CollectMapFeatures() : PCGSharpHighLevelFeatures {
	var featureCollector : PCGSharpHighLevelFeatures = new PCGSharpHighLevelFeatures();
	var rootNode : PCGTreeNEATNode = evolution.mapToBuild.rootNode as PCGTreeNEATNode;
	rootNode.RecursiveSharpHighLevelFeatureCompile(featureCollector, PCGSharpHighLevelFeatures.C_HL_ROOMTYPE.NoPreviousRoom);		
	return featureCollector;
}

function SendAllNetworkData(featureString : String, neatString : String, geomString : String) {
	yield StartCoroutine(networkManager.WriteFeatureData(networkManager.currentPlayerID, featureString));
	if (networkManager.lastMsg != networkManager.msg_success)
		Debug.LogError("Network Error: WriteFeatureData: " + networkManager.lastMsg);
		
	yield StartCoroutine(networkManager.WriteNEATData(networkManager.currentPlayerID, neatString));
	if (networkManager.lastMsg != networkManager.msg_success)
		Debug.LogError("Network Error: WriteNEATData: " + networkManager.lastMsg);
		
	yield StartCoroutine(networkManager.WriteGeometryData(networkManager.currentPlayerID, geomString));
	if (networkManager.lastMsg != networkManager.msg_success)
		Debug.LogError("Network Error: WriteGeometryData: " + networkManager.lastMsg);
		
	// Send off any log data
	yield StartCoroutine(SendLogNetworkData(geomString));
	
	gameState = PCG_STATE.UpdateClassifier;
}


function SendFeatureNetworkData(featureString : String, geomString : String) {
	yield StartCoroutine(networkManager.WriteFeatureData(networkManager.currentPlayerID, featureString));
	if (networkManager.lastMsg != networkManager.msg_success)
		Debug.LogError("Network Error: WriteFeatureData: " + networkManager.lastMsg);
	
	// Send off any log data
	yield StartCoroutine(SendLogNetworkData(geomString));
			
	gameState = PCG_STATE.UpdateClassifier;
}


function SendLogNetworkData(geomString : String) {
	if (logger != null) {
		logger.AddEntry("ended Map");	
		
		var logString = logger.GetLog();
		var statString = logger.GetStatsString();
		var stats = logger.GetFeatureStats();
	
		yield StartCoroutine(networkManager.WriteLogAndStatsData(networkManager.currentPlayerID, logString, geomString, statString,
															logger.GetMapCompleted(), logger.GetRoomsVisited(), stats, logger.GetWeaponsPickedup()));
															
		if (networkManager.lastMsg != networkManager.msg_success)
			Debug.LogError("Network Error: WriteLogData: " + networkManager.lastMsg);
						
		logger.ResetLog();
	}	
}	

function FeatchAllNetworkData() {
	// Fetch geometry data first		
	var playerID : String = networkManager.currentPlayerID;
	yield StartCoroutine(networkManager.FetchGeometryData(playerID));
	if (networkManager.lastMsg == "") {
		// Start from random if no geometry exists (new user)
		gameStartGUI.firstTurn = true;
		gameState = PCG_STATE.ShowStartScreen;
		return;		
	}
	else {
		if (networkManager.lastMsg.Equals(PCGTreeNetworkManager.msg_noFile))
			Debug.LogError("File not found while trying to read geometry data");
		else {
			// Otherwise, set the first geometry candidate
			evolution.geomPop[0] = evolution.StringToCandidate(networkManager.lastMsg);	
		}
	}	
		
	yield StartCoroutine(networkManager.FetchFeatureData(playerID));
	if (networkManager.lastMsg.Equals(PCGTreeNetworkManager.msg_noFile))
		Debug.LogError("File not found while trying to read Classifier data");
	else {
		playerModel = new PCGWekaClassifier();
		playerModel.InitializeClassifier(networkManager.lastMsg);	
	}
	
	yield StartCoroutine(networkManager.FetchNEATData(playerID));
	if (networkManager.lastMsg.Equals(PCGTreeNetworkManager.msg_noFile))
		Debug.LogError("File not found while trying to read NEAT data");
	else {
		evolution.contentEA.Initialize(networkManager.lastMsg);	
	}
	
	gameState = PCG_STATE.ShowStartScreen;
}


function FetchFeatureNetworkData() {
	yield StartCoroutine(networkManager.FetchFeatureData(networkManager.currentPlayerID));
	playerModel = new PCGWekaClassifier();
	playerModel.InitializeClassifier(networkManager.lastMsg);
	
	gameState = PCG_STATE.WhatNext;
}

function FetchArchiveGeometryData(playerID:String, mapID:int, nextState:PCG_STATE) {
	yield StartCoroutine(networkManager.FetchArchiveGeometryData(playerID, mapID));
	if (networkManager.lastMsg.Equals(PCGTreeNetworkManager.msg_noFile)) {
		Debug.LogError("File not found while trying to read archive geometry data");
		gameState = PCG_STATE.ShowStartScreen;		
	}
	else {
		// Otherwise, set the first geometry candidate
		evolution.geomPop[0] = evolution.StringToCandidate(networkManager.lastMsg);
		geomSelectionGUI.lastSelection = 0;
		buildMode = PCG_METHOD.Defined;
		
		// Capture a screenshot of the geometry
		geometryBuilder.BuildMap(evolution.geomPop[0]);
		geometryBuilder.DisablePlayer();
		yield;			
		yield StartCoroutine(mapPreviewCapture.CameraToScreenshot("player_"+playerID+"_matlabMapID_"+mapID,geometryBuilder.mapParent.transform));
		yield;	
		geometryBuilder.DestroyLastMap();
		
		gameState = nextState;	
	}		
} 


function FeacthArchiveCPPNdata(playerID:String) {
	yield StartCoroutine(networkManager.FetchNEATData(playerID));
	if (networkManager.lastMsg.Equals(PCGTreeNetworkManager.msg_noFile)) {
		Debug.LogError("File not found while trying to read NEAT data");
		gameState = PCG_STATE.ShowStartScreen;		
	}
	else {
		evolution.contentEA.Initialize(networkManager.lastMsg);
		geometryBuilder.randomSibIndex = true;
		// Generate a random population
		yield;
		yield evolution.RandomGeomPopulation(fixedNumRooms,fixedBranchingProbability,fixedBranchingDecay,true);
		yield;
		geometryBuilder.randomSibIndex = false;
		
		// Apply the CPPN to each geometry and capture the resul	
		for (var i : int = 0; i < evolution.geomPopSize; i++) {
			geomSelectionGUI.lastSelection = i;
			buildMode = PCG_METHOD.Defined;
			
			var mapToBuild = evolution.geomPop[i];
			var maxDepth : int = (mapToBuild.rootNode as PCGTreeNEATNode).RecursiveFindMaxDepth(0);
		    (mapToBuild.rootNode as PCGTreeNEATNode).RecursiveCPPNContentCalculator(evolution.contentEA,0,0,maxDepth, PCGGenericRoomManager.maxDoors-1);
		    var counter : PCGTreeCounterHelper = new PCGTreeCounterHelper();
			mapToBuild.rootNode.RecursiveCountTotalNodes(counter);
			mapToBuild.totalNodeCount = counter.count;
			
			// Capture a screenshot of the geometry
			geometryBuilder.BuildMap(mapToBuild);
			geometryBuilder.DisablePlayer();
			yield;			
			yield StartCoroutine(mapPreviewCapture.CameraToScreenshot("player_"+playerID+"_CPPNTest_"+i,geometryBuilder.mapParent.transform));
			yield;
			
			var file : System.IO.StreamWriter  = new System.IO.StreamWriter("ScreenShots/Geom-player_"+playerID+"_CPPNTest_"+i+".txt");
			file.Write(evolution.CandidateToString(mapToBuild,maxDepth.ToString()));
			file.Close();
			
			geometryBuilder.DestroyLastMap();
		}
		
		yield StartCoroutine(networkManager.FetchNEATData(networkManager.currentPlayerID));
		if (networkManager.lastMsg.Equals(PCGTreeNetworkManager.msg_noFile))
			Debug.LogError("File not found while trying to read NEAT data");
		else {
			evolution.contentEA.Initialize(networkManager.lastMsg);	
		}
		gameState = PCG_STATE.ShowStartScreen;	
	}	
}



function ClearGeometryPopulation() {
	for (var i : int = 0; i < evolution.geomPop.Length; i++)
		evolution.geomPop[i] = null;
}

function CaptureGeomListFromFile() {
//IS THE RIGHT MAP ID BEING PASSED?
	var file : StreamReader = new StreamReader("..\\Matlab Analysis\\VeryGoodOptimizedMaps.txt");
	var line : String = file.ReadLine();
	
	while (line != null) {	
		Debug.Log(line);	
		var split = line.Split(','[0]);
		
		if (parseInt(split[0]) > 7490)
			yield StartCoroutine(FetchArchiveGeometryData(split[0], parseInt(split[1]), PCG_STATE.AwaitingPlayer));
			
		line = file.ReadLine();	
	}
	gameState = PCG_STATE.ShowStartScreen;
}

function RandomGeomTest() {
	var measurePoint : int = 10;
	var numTries : int = 0;	
	var totalCounts : int[] = new int[measurePoint+1];
	var validCounts : int[] = new int[measurePoint+1];
	
	/* Randomly generate iterMax valid maps and see the room distribution of them 
	var iterMax : int = 100000;
	var iter : int = 0;	
	
	while (iter <= iterMax) {
		var aMap : PCGTreeNEATCandidate = evolution.RandomCandidate(-1,-1,-1);
		yield StartCoroutine(geometryBuilder.ValidateMap(aMap));
		if (geometryBuilder.validMap)
		{
			iter++;
			if (aMap.totalNodeCount <= measurePoint)
				validCounts[aMap.totalNodeCount]++;	
				
			if (parseFloat(iter)%100 == 0)
			{
				Debug.Log('-----'+iter+'------');
				for (var i : int = 2; i <= measurePoint; i++)
					Debug.Log(i + ' rooms: total = ' + validCounts[i]);				
			}			
		}					
	}
	for (i = 2; i <= measurePoint; i++)
		Debug.Log(i + ' rooms: total = ' + validCounts[i]);*/

	
	/* Generate itermax number of maps per room count and see how many of them are valid /
	var iterMax : int = 10000;
	var stop : boolean = false;
	
	while (stop == false) {
		var aMap : PCGTreeNEATCandidate = evolution.RandomCandidate(-1,-1,-1);		
		if (aMap.totalNodeCount <= measurePoint)
		{
			numTries++;	
			if (totalCounts[aMap.totalNodeCount] < iterMax)
			{		
				totalCounts[aMap.totalNodeCount]++;
				yield StartCoroutine(geometryBuilder.ValidateMap(aMap));
				if (geometryBuilder.validMap)
					validCounts[aMap.totalNodeCount]++;
			}
			
			stop = true;	
			for (var i : int = 2; i <= measurePoint; i++)
			{
				if (totalCounts[i] < iterMax)
				{
					stop = false;
					break;
				}
			}
			if (parseFloat(numTries)%100 == 0)
			{
				Debug.Log('-----'+numTries+'------');
				for (i = 2; i <= measurePoint; i++)
					Debug.Log(i + ' rooms: total = ' + totalCounts[i]);				
			}
		}	
	}
	for (i = 2; i <= measurePoint; i++)
		Debug.Log(i + ' rooms: total = ' + totalCounts[i] + ', valid = ' + validCounts[i]); */

	
	/* Find a map with x number of rooms and then mutate it y times */
	var currentRooms : int = 2;	
	var changeMatrix = new int[measurePoint+1,measurePoint+1];
	var totalMutations : int = 0;
	var totalTime : double = 0.0;
	for (var parent : int = 2; parent <= measurePoint; parent++)
		for (var child : int = 2; child <= measurePoint; child++)
			changeMatrix[parent,child] = 0;
			
	var parentNum : int = 0;
	while (currentRooms <= measurePoint) {
		while (true) {
			var aMap : PCGTreeNEATCandidate = evolution.RandomCandidate(-1,-1,-1);
			numTries++;
			
			if (aMap.totalNodeCount == currentRooms)
			{
				yield StartCoroutine(geometryBuilder.ValidateMap(aMap));
				if (geometryBuilder.validMap)
					break;
			}	
		}
		parentNum++;
		
		var iterMax : int = 1000;
		var iter : int = 0;
		var mutationRateRange : float = 1-evolution.minMutationRate;
		var inverseMutationRate : float = 1-((aMap.totalNodeCount/10)*mutationRateRange);
		// And if there are more than 10 rooms...
		if (inverseMutationRate < evolution.minMutationRate)
			inverseMutationRate = evolution.minMutationRate;
		Debug.Log('Now mutating...');	
		while (iter < iterMax)
		{
			var startTime : double = Time.realtimeSinceStartup;
			var childMap : PCGTreeNEATCandidate = new PCGTreeNEATCandidate(aMap);
			(childMap.rootNode as PCGTreeNEATNode).RecursiveFixedTreeMutation(childMap, null, childMap.branchingProbability, inverseMutationRate, 2, measurePoint+1);
			yield StartCoroutine(geometryBuilder.ValidateMap(childMap));
			totalTime = totalTime + (Time.realtimeSinceStartup - startTime);
			totalMutations++;
			if (geometryBuilder.validMap) 
			{
				iter++;
				
				var counter : PCGTreeCounterHelper = new PCGTreeCounterHelper();
				childMap.rootNode.RecursiveCountTotalNodes(counter);				
				if (counter.count <= measurePoint) {
					changeMatrix[currentRooms,counter.count]++;					
				}
				if (parseFloat(iter)%100 == 0)
				{
					Debug.Log(currentRooms + ' rooms: parentNum = ' + parentNum + ', iter = ' + iter);			
				}
				
			}
		}
			
		if (parentNum == 10) {
			currentRooms++;
			parentNum = 0;
		}
	}
	/*for (var i : int = 2; i <= measurePoint; i++)
		Debug.Log(i + ' rooms: total = ' + totalCounts[i] + ', valid = ' + validCounts[i]);*/
		
		
	var dist : int[] = new int[measurePoint+1];	
	for (parent = 2; parent <= measurePoint; parent++)
	{
		var line : String = parent.ToString() + ' room parent :';
		for (child = 2; child <= measurePoint; child++)
		{
			line = line + ' ' + changeMatrix[parent,child].ToString();
			dist[child] += changeMatrix[parent,child];
		}
		Debug.Log(line);
	}
	
	Debug.Log("Average mutation time: " + (totalTime/totalMutations) + ' (taken from ' + totalMutations + ' mutations');
	
	line = 'Distribution: ';
	for (child = 2; child <= measurePoint; child++)
	{
		line = line + ' ' + dist[child].ToString();
		dist[child] += changeMatrix[parent,child];
	}
	Debug.Log(line);
	
	gameState = PCG_STATE.ShowStartScreen;
}

function RepairCPPNGenomes() {
 	Debug.Log("Repairing Player 2393 based on Map 17");
	var lastMapData = System.IO.File.ReadAllText("DataForMatlab\\Unity-UserData_Backup_March\\4132\\Map-85-Geom.txt");
	var lastMap = evolution.StringToCandidate(lastMapData);
	var featureCollector : PCGSharpHighLevelFeatures = new PCGSharpHighLevelFeatures();
	var rootNode : PCGTreeNEATNode = lastMap.rootNode as PCGTreeNEATNode;
	rootNode.RecursiveSharpHighLevelFeatureCompile(featureCollector, PCGSharpHighLevelFeatures.C_HL_ROOMTYPE.NoPreviousRoom);			
	Debug.Log("....Original Features Gathered");
	
	var genomeData = System.IO.File.ReadAllText("DataForMatlab\\Unity-UserData_Backup_March\\4132\\4132-NEATGenomes.xml");
	var repairEA : CPPNRepairEA = new CPPNRepairEA();
	repairEA.Initialize(featureCollector);
	Debug.Log("....Repair EA initialized");
	
	
	yield;
	yield;		
	var maxDepth : int = (lastMap.rootNode as PCGTreeNEATNode).RecursiveFindMaxDepth(0);
	var nodeList : List.<PCGNeatNodeData> = new List.<PCGNeatNodeData>();
	(lastMap.rootNode as PCGTreeNEATNode).RecursiveJtoCTreeConversion(nodeList,null,0,0,maxDepth,PCGGenericRoomManager.maxDoors-1);
	
	yield;
	yield;
	Debug.Log("....Begining evolution");	
	repairEA.RunEA(nodeList, null);	
	
	yield;	
	repairEA.PrintStats();
	var writer = new System.IO.StreamWriter("DataForMatlab\\Unity-UserData_Backup_March\\4132\\4132-CPPNRepairedGenomes.xml"); 
	
	var results = repairEA.GenomeListToXmlString();
	//StreamWriter writer = new StreamWriter("DataForMatlab/"+playerID+"_CrossFoldCorrCoeff.txt"); // For mathews cc
	writer.WriteLine(results);
	writer.Close();
		
	gameState = PCG_STATE.ShowStartScreen;	
}
