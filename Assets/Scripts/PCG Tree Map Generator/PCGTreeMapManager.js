#pragma strict
@script RequireComponent(PCGTreeGeometryBuilder)
@script RequireComponent(PCGTreeEvolution)

///enum PCG_MODE {Evolve, SingleRandom, SingleHard, SingleEasy, SpeedTest, EvolutionTest}

var pcg_mode : PCG_MODE = PCG_MODE.SingleRandom;
var minNumDirectPathRooms : int = 2;
var maxNumDirectPathRooms : int = 7;
var maxNumRoomsPerCandidate : int = 10;
var fixedNumRooms : int = 3;
var fixedBranchingProbability : float = 0.5;
var fixedBranchingDecay : float = 0.5;
var numSpeedTestMaps : int = 100;

@HideInInspector
public var mapPlayed : boolean;
@HideInInspector
public var retryMap : boolean;
@HideInInspector
public var lastRating : String;
@HideInInspector
public var networkManager : PCGTreeNetworkManager;

private var geometryBuilder : PCGTreeGeometryBuilder;
private var evolution : PCGTreeEvolution;
//private var playerModel : PCGLinearClassifierWrapper;

public var sceneCleaner : PCGTreeSceneCleaner;

/* GUIs */
private var gameStartGUI : PCGGameStartGUI;
private var loadingGUI : PCGLoadingGUI;
private var deathGUI : PCGDeathGUI;
private var ratingGUI : PCGRatingGUI;


function Start () {
	gameStartGUI = gameObject.GetComponent(PCGGameStartGUI);
	loadingGUI = gameObject.GetComponent(PCGLoadingGUI);
	deathGUI = gameObject.GetComponent(PCGDeathGUI);
	ratingGUI = gameObject.GetComponent(PCGRatingGUI);
	networkManager = GameObject.FindGameObjectWithTag("NetworkManager").GetComponent(PCGTreeNetworkManager);
	
	gameStartGUI.enabled = true;
	while (gameStartGUI.enabled)
		yield;

	geometryBuilder = gameObject.GetComponent(PCGTreeGeometryBuilder);
	evolution = gameObject.GetComponent(PCGTreeEvolution);
	var candidate : PCGTreeCandidate;
	var startTime : float = Time.realtimeSinceStartup;	
	
	mapPlayed = false;
	retryMap = false;
	
	if (pcg_mode == PCG_MODE.Evolve){
		//loadingGUI.enabled = true;
		// Naive Bayes Classifier
		//var playerModel : PCGLinearClassifierWrapper = new PCGLinearClassifierWrapper();
		//playerModel.InitializeTable();
		//playerModel.FillDummyTable();
		//playerModel.TrainClassifier();
		
		loadingGUI.loadMessage = "Loading New Map";
		loadingGUI.enabled = true;
		yield StartCoroutine(evolution.RandomPopulation(PCGTreeEvolution.randomizeFlag,PCGTreeEvolution.randomizeFlag,PCGTreeEvolution.randomizeFlag));
		Debug.Log("Initial population created");
		
		while(true) {
			startTime = Time.realtimeSinceStartup;	
			Debug.Log("Starting Evolution...");
			yield StartCoroutine(evolution.Evolve());
			Debug.Log("Fitness of X[0] = " + evolution.R[0] + 
						". Total generations so far: " + evolution.totalGenerations + 
						". Total fitness evalutations so far:  " + evolution.totalEvaluations +
						". Node Count of X[0]: " + evolution.X[0].totalNodeCount);				
			
			// Play untul the user gives up or finishes the map
			retryMap = true; //just to get in loop
			while(retryMap) {
				retryMap = false; // needs to be set false because gameEnd gui doesn't set this value	
				geometryBuilder.BuildMap(evolution.X[0]);
				loadingGUI.enabled = false;	
				
				mapPlayed = false;
				while(!mapPlayed)
					yield;
				
				loadingGUI.enabled = true;
				geometryBuilder.DestroyLastMap();	
			}
			
			// Show the rating screen and wait for the players rating
			loadingGUI.enabled = false;
			//sceneCleaner.CleanUp();
			ratingGUI.enabled = true;
			while(ratingGUI.enabled)
				yield;
				
			// Compile data and send it over the network
			var dataString : String = networkManager.CompileDataString(evolution.X[0], lastRating, geometryBuilder.dummyRoom);
			//networkManager.WriteData(networkManager.currentPlayerID, dataString);
			dataString = networkManager.CompileAltDataString(evolution.X[0], lastRating, geometryBuilder.dummyRoom);
			//Debug.Log(dataString);
			//networkManager.WriteAltData(networkManager.currentPlayerID, dataString);
			
			loadingGUI.enabled = true;	
			
			//Debug.Log("Getting classifier representation...");
			//var classifierRep = evolution.ToClassifierRep(evolution.X[0]);
			//playerModel.AddTableEntry(lastRating, classifierRep);
			//Debug.Log("Re-training Classifier...");
			//playerModel.TrainClassifier();			
			
		} 			
	}
	
	
	if (pcg_mode == PCG_MODE.SingleRandom) {	
		while(true) {
			startTime = Time.realtimeSinceStartup;	
			loadingGUI.enabled = true;
			if (!retryMap) { 
				candidate = evolution.RandomCandidate(fixedNumRooms,fixedBranchingProbability,fixedBranchingDecay);
				yield StartCoroutine(geometryBuilder.ValidateMap(candidate));
				
				var invalidCount : int = 0;		
				while (!geometryBuilder.validMap) {
					invalidCount++;		
					candidate = evolution.RandomCandidate(fixedNumRooms,fixedBranchingProbability,fixedBranchingDecay);
					yield StartCoroutine(geometryBuilder.ValidateMap(candidate));
				}
		
				Debug.Log(invalidCount + " invalid maps generated in " + (Time.realtimeSinceStartup-startTime) + " seconds.");			
			}
			else
				geometryBuilder.DestroyLastMap();			
			
			geometryBuilder.BuildMap(candidate);
			retryMap = false;
			mapPlayed = false;	
			loadingGUI.enabled = false;	
			
			while (!mapPlayed)
				yield WaitForSeconds(2.0);
				
			mapPlayed = false;
			
			if (!retryMap) {
				geometryBuilder.DestroyLastMap(); 
				
				//sceneCleaner.CleanUp();
				ratingGUI.enabled = true;
				while (ratingGUI.enabled)
					yield;
				
				// Compile low level data and send it over the network				
				dataString = networkManager.CompileDataString(candidate, lastRating, geometryBuilder.dummyRoom);	
				candidate.PrintAdjacencyMatrix();			
				//Debug.Log(dataString);	
				//networkManager.WriteData(networkManager.currentPlayerID, dataString);
				
				// Compile high level data and send it over the network
				dataString = networkManager.CompileAltDataString(candidate, lastRating, geometryBuilder.dummyRoom);
				//Debug.Log(dataString);
				//networkManager.WriteAltData(networkManager.currentPlayerID, dataString);
			}					
		} 
	}
	
	
	// For 6 features, 4 settings. Combinations = settings^(features) = 4,096
	if (pcg_mode == PCG_MODE.SingleHard) {
		Debug.LogWarning("SingleHard not implemented for Tree");	
	}
	
	// For 6 features, 4 settings. Combinations = settings^(features) = 4,096
	if (pcg_mode == PCG_MODE.SingleEasy) {
		Debug.LogWarning("SingleEasy not implemented for Tree");
	}
	
	if (pcg_mode == PCG_MODE.SpeedTest) {		
		for (var i = 0; i < numSpeedTestMaps; i++) {
			candidate = evolution.RandomCandidate(fixedNumRooms,fixedBranchingProbability,fixedBranchingDecay);
			yield StartCoroutine(geometryBuilder.ValidateMap(candidate));
		}		
		Debug.Log("Speed Test: " + numSpeedTestMaps + " maps generated in " + (Time.realtimeSinceStartup-startTime) + " seconds.");
	}
	
	if (pcg_mode == PCG_MODE.EvolutionTest) {
		/*
		var dudModel = new PCGLinearClassifierWrapper(); //just a blank
		yield StartCoroutine(evolution.RandomPopulation(fixedNumRooms));
		Debug.Log("Initial population created");
		
		var j : int = 0;
		while (evolution.R[0] < 40) {
			Debug.Log("Evolution run " + (j+1) + " is starting...");
			yield StartCoroutine(evolution.Evolve(dudModel));
			Debug.Log("Fitness of X[0] = " + evolution.R[0]);
			j++;	
		}
		
		geometryBuilder.BuildMap(evolution.X[0]);	
		Debug.Log("Build fitness = " + evolution.TestingFitnessEvaluation(evolution.X[0]) + ", gene " + evolution.CandidateToString(evolution.X[0]));
		Debug.Log("Size of X = " + evolution.X.length);
		*/
		Debug.LogWarning("EvolutionTest not implemented for Tree");
	}	
}