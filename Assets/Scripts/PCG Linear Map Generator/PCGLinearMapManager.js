#pragma strict
@script RequireComponent(PCGLinearGeometryBuilder)
@script RequireComponent(PCGLinearEvolution)

enum PCG_MODE {Evolve, SingleRandom, SingleHard, SingleEasy, SpeedTest, EvolutionTest}

var pcg_mode : PCG_MODE = PCG_MODE.SingleRandom;
var minNumRooms : int = 2;
var maxNumRooms : int = 10;
var fixedNumRooms : int = 3;
var numSpeedTestMaps : int = 100;

@HideInInspector
public var mapPlayed : boolean;
@HideInInspector
public var retryMap : boolean;
@HideInInspector
public var lastRating : String;

private var geometryBuilder : PCGLinearGeometryBuilder;
private var evolution : PCGLinearEvolution;
//private var playerModel : PCGLinearClassifierWrapper; // If we want to use this again, its in the packages in the project folder

/* GUIs */
private var gameStartGUI : PCGGameStartGUI;
private var loadingGUI : PCGLoadingGUI;
private var playerHUD : PCGGameHUD;
private var deathGUI : PCGDeathGUI;
private var ratingGUI : PCGRatingGUI;


function Start () {
	gameStartGUI = gameObject.GetComponent(PCGGameStartGUI);
	loadingGUI = gameObject.GetComponent(PCGLoadingGUI);
	deathGUI = gameObject.GetComponent(PCGDeathGUI);
	ratingGUI = gameObject.GetComponent(PCGRatingGUI);
	playerHUD = GameObject.FindGameObjectWithTag("Player").GetComponent(PCGGameHUD);
	
	playerHUD.enabled = false;
	gameStartGUI.enabled = true;
	while (gameStartGUI.enabled)
		yield;

	geometryBuilder = gameObject.GetComponent(PCGLinearGeometryBuilder);
	evolution = gameObject.GetComponent(PCGLinearEvolution);
	var candidate : List.<PCGLinearGene>;
	var startTime : float = Time.realtimeSinceStartup;	
	
	mapPlayed = false;
	retryMap = false;
	
	if (pcg_mode == PCG_MODE.Evolve){
		loadingGUI.enabled = true;
		// Naive Bayes Classifier
		//var playerModel : PCGLinearClassifierWrapper = new PCGLinearClassifierWrapper();
		//playerModel.InitializeTable();
		//playerModel.FillDummyTable();
		//playerModel.TrainClassifier();
		
		yield StartCoroutine(evolution.RandomPopulation(fixedNumRooms));
		Debug.Log("Initial population created");
		
		while(true) {
			Debug.Log("Starting Evolution...");
			yield StartCoroutine(evolution.Evolve());
			Debug.Log("Fitness of X[0] = " + evolution.R[0] + 
						". Total generations so far: " + evolution.totalGenerations + 
						". Total fitness evalutations so far:  " + evolution.totalEvaluations);	
			
			// Play untul the user gives up or finishes the map
			retryMap = true; //just to get in loop
			while(retryMap) {
				retryMap = false; // needs to be set false because gameEnd gui doesn't set this value	
				geometryBuilder.BuildMap(evolution.X[0]);
				loadingGUI.enabled = false;	
				playerHUD.enabled = true;
				
				mapPlayed = false;
				while(!mapPlayed)
					yield;
				
				loadingGUI.enabled = true;
				geometryBuilder.DestroyLastMap();	
			}
			
			// Show the rating screen and wait for the players rating
			loadingGUI.enabled = false;
			ratingGUI.enabled = true;
			while(ratingGUI.enabled)
				yield;
			
			loadingGUI.enabled = true;	
			Debug.Log("Getting classifier representation...");
			var classifierRep = evolution.ToClassifierRep(evolution.X[0]);
			//playerModel.AddTableEntry(lastRating, classifierRep);
			Debug.Log("Re-training Classifier...");
			//playerModel.TrainClassifier();			
			
		}	
				
	}
	
	
	if (pcg_mode == PCG_MODE.SingleRandom) {	
		while(true) {
			loadingGUI.enabled = true;
			if (!retryMap) {
				geometryBuilder.DestroyLastMap();
				candidate = evolution.RandomCandidate(fixedNumRooms);
				yield StartCoroutine(geometryBuilder.ValidateMap(candidate));
				
				var invalidCount : int = 0;		
				while (!geometryBuilder.validMap) {
					invalidCount++;		
					//geometryBuilder.DestroyLastMap();
					candidate = evolution.RandomCandidate(fixedNumRooms);
					yield StartCoroutine(geometryBuilder.ValidateMap(candidate));
				}
		
				Debug.Log(invalidCount + " invalid maps generated in " + (Time.realtimeSinceStartup-startTime) + " seconds.");		
			}
			else
				geometryBuilder.DestroyLastMap();
			
			//geometryBuilder.DestroyLastMap();
			geometryBuilder.BuildMap(candidate);
			loadingGUI.enabled = false;
			playerHUD.enabled = true;
			
			while (!mapPlayed)
				yield;
				
			mapPlayed = false;
			
			if (!retryMap) {
				ratingGUI.enabled = true;
				while (ratingGUI.enabled)
					yield;
			}			
		}
	}
	
	
	// For 6 features, 4 settings. Combinations = settings^(features) = 4,096
	if (pcg_mode == PCG_MODE.SingleHard) {
		var firstCorr : PCGLinearGene = new PCGLinearGene(0,0,0,0);
		var firstRoom : PCGLinearGene = new PCGLinearGene(0,4095,2,1);
		var secondRoom : PCGLinearGene = new PCGLinearGene(0,8190,1,2);
		
		candidate = new List.<PCGLinearGene>(3);
		candidate.Add(firstCorr);
		candidate.Add(firstRoom);
		candidate.Add(secondRoom);
		
		geometryBuilder.BuildMap(candidate);	
	}
	
	// For 6 features, 4 settings. Combinations = settings^(features) = 4,096
	if (pcg_mode == PCG_MODE.SingleEasy) {
		firstCorr = new PCGLinearGene(0,0,0,0);
		firstRoom = new PCGLinearGene(0,0,2,1);
		secondRoom = new PCGLinearGene(0,4096,1,2);
		
		candidate = new List.<PCGLinearGene>(3);
		candidate.Add(firstCorr);
		candidate.Add(firstRoom);
		candidate.Add(secondRoom);
		
		geometryBuilder.BuildMap(candidate);	
	}
	
	if (pcg_mode == PCG_MODE.SpeedTest) {		
		for (var i = 0; i < numSpeedTestMaps; i++) {
			candidate = evolution.RandomCandidate(fixedNumRooms);
			yield StartCoroutine(geometryBuilder.ValidateMap(candidate));
			//geometryBuilder.DestroyLastMap();
		}		
		Debug.Log("Speed Test: " + numSpeedTestMaps + " maps generated in " + (Time.realtimeSinceStartup-startTime) + " seconds.");
	}
	
	if (pcg_mode == PCG_MODE.EvolutionTest) {
	//var dudModel = new PCGLinearClassifierWrapper(); //just a blank
		yield StartCoroutine(evolution.RandomPopulation(fixedNumRooms));
		Debug.Log("Initial population created");
		
		var j : int = 0;
		while (evolution.R[0] < 40) {
			Debug.Log("Evolution run " + (j+1) + " is starting...");
			yield StartCoroutine(evolution.Evolve());
			Debug.Log("Fitness of X[0] = " + evolution.R[0]);
			j++;	
		}
		
		geometryBuilder.BuildMap(evolution.X[0]);	
		Debug.Log("Build fitness = " + evolution.TestingFitnessEvaluation(evolution.X[0]) + ", gene " + evolution.CandidateToString(evolution.X[0]));
		Debug.Log("Size of X = " + evolution.X.length);
	}	
}


