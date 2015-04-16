#pragma strict
#pragma strict
private var mapManager : PCGTreeNEATMapManager;

var guiSkin : GUISkin;
var cursorImage : Texture;

@HideInInspector
var titles : String[] = ["Goal:","Rating:","Controls:","Game HUD:",
						"Doors:","Pick-ups:","Enemies – Buzz Bots:",
						"Enemies – Spider Bots:","Enemies – Mechs:"];
var images : Texture[];
@HideInInspector
private var descriptions : String[] = ["The goal of the game is very simple. Get from one end of the map to the other!  The room shown in the image above is what the Starting Room and Ending Room look like (they are the same). Once you get to the End Room, stand in the capsule (in the top right of the image) and press Interact (‘E’). Can’t finish a map? Simply press Pause (‘Esc’) and select ‘New Map’.\n\nOnce you have finished one map, try another! If you find that maps are too easy or too hard, don’t be put off, just keep playing and this should change over time. ",
								"At the end of each map you will be asked to rate the map from ‘Very Bad’ to ‘Very Good’. It’s up to you decide what you like and what you don’t like. Be honest and thoughtful when providing your rating, your feedback will change the type of maps you are likely to see in the future. \n\nRemember, your rating the map you just played, not the game as a whole; if you don’t enjoy the game at all, unfortunately that is not going to change.",
								"Move – A,W,S,D\nAim – Mouse Movement\nShoot – Left Mouse Button\nAlternative Attack – Right Mouse Button\nWalk Slowly – Left Shift\nInteract – E\nPause / Restart / New Map - Esc",
								"Health – The blue pie chart at the bottom left shows your current health. If it drops to 0, you will die.\nAmmo – The picture of the gun and the number on the bottom right shows your ammo. If this drops to 0, you will need to use the Alternative Attack (‘Right Mouse Button’) until you find more ammo.",
								"To open a door, simply walk up to it and it should open. If the door doesn’t open, then it means it is locked and you can’t go that way. Try to find another door to proceed. There can be branching paths in the map so you may have to retrace your steps to previous rooms if you have missed an unlocked door earlier on.",
								"To pick-up items, stand next to any of the containers shown above and press Interact (‘E’) to collect the contents.\n\nAmmo - Yellow Barrels\nHealth – Blue Barrels\nNew Weapons – Pyramid Crates. Interacting with one of these will pause the game and show you a description of your current weapon and the new weapon. Choose whether to pick-up the new weapon or keep your existing one.",
								"Buzz Bots are fast moving and easy to kill. They need to be right next to you so destroy them before they get close. One Buzz Bot will not do much harm to you but a swarm of them can do a lot of damage.",
								"Spider Bots are typically asleep until you get too close. Once the alarm is sounded, they will get as close to you as possible and detonate themselves, cause a large amount of damage. If you manage to catch one unaware, try to save some ammo by Walking up to them (holding the ‘Shift’ key) and pressing Interact (‘E’) to destroy them harmlessly.",
								"Mechs can shoot at you from a distance and do a lot of damage with each shot. They are also very hard to destroy and it will take a lot of ammo to clear one. On the upside, they are slow moving and a little bit dumb, you have to be quite close for them to notice you, making it easier to avoid them."];


var backgroundSize = Vector2(800,800);
var imageSize = Vector2(300,300);
var descriptionSize = Vector2(300,200);

var buttonSize = Vector2(110,70);
var buttonSeperation = 20;

@HideInInspector
var pageMarker : int;

function Awake() {
	pageMarker = 0;
	if (titles.Length != images.Length || titles.Length != descriptions.Length)
		Debug.LogError("PCG Tutorial GUI: Should have the same number of titles, images, and descriptions");
	mapManager = gameObject.GetComponent(PCGTreeNEATMapManager);
	enabled = false;
}

function OnGUI () {
	if (pageMarker < 0)
		pageMarker = 0;
	if (pageMarker >= titles.Length)
		pageMarker = titles.Length-1;
		
	Input.ResetInputAxes();
	if (Time.timeScale == 1)
		Time.timeScale = 0;
		
	GUI.skin = guiSkin;
	var backgroundOffset = new Vector2((Screen.width/2)-(backgroundSize.x/2), (Screen.height/2)-(backgroundSize.y/2));
	GUI.Box(Rect(backgroundOffset.x, backgroundOffset.y, backgroundSize.x, backgroundSize.y), titles[pageMarker]);
	
	var imageOffset = new Vector2((Screen.width/2)-(imageSize.x/2), (Screen.height/2)-imageSize.y);
	if (images[pageMarker] != null) {
		if (pageMarker == 1) // Fix the rating GUI
			GUI.Box(Rect(imageOffset.x, imageOffset.y+(imageSize.y/3), imageSize.x, imageSize.y-(imageSize.y/2)), images[pageMarker]);
		else	
			GUI.Box(Rect(imageOffset.x, imageOffset.y, imageSize.x, imageSize.y), images[pageMarker]);		
	}
	
	var descOffset = new Vector2((Screen.width/2)-(descriptionSize.x/2), (Screen.height/2)+buttonSeperation);
	GUI.Box(Rect(descOffset.x, descOffset.y, descriptionSize.x, descriptionSize.y), descriptions[pageMarker],GUI.skin.customStyles[2]);
	
	var buttonOffset = new Vector2((Screen.width/2), (Screen.height/2)+(buttonSeperation*2)+descriptionSize.y);
	
	if (pageMarker > 0) {
		if (GUI.Button(Rect(buttonOffset.x-buttonSize.x-(buttonSize.x/2)-buttonSeperation, buttonOffset.y, buttonSize.x, buttonSize.y), "Previous")) {
			pageMarker--;		
		}
	}
	
	if (GUI.Button(Rect(buttonOffset.x-(buttonSize.x/2), buttonOffset.y, buttonSize.x, buttonSize.y), "Menu")) {
		Time.timeScale = 1;
		mapManager.gameState = PCG_STATE.ShowStartScreen;
		enabled = false;	
	}
	
	if (pageMarker < images.Length-1) {
		if (GUI.Button(Rect(buttonOffset.x+(buttonSize.x/2)+buttonSeperation, buttonOffset.y, buttonSize.x, buttonSize.y), "Next")) {
			pageMarker++;		
		}
	}
	
	// Draw cursor last to be on top
	var mousePos : Vector3 = Input.mousePosition;
    var pos : Rect = Rect(mousePos.x,Screen.height - mousePos.y,cursorImage.width/3,cursorImage.height/3);
    GUI.Label(pos,cursorImage);
}