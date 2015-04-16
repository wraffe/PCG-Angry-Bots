#pragma strict

var guiSkin : GUISkin;

var guideList : List.<Vector3>;
var opacityList : List.<SETTINGS[]>;
var labelList : List.<String>;
private var refOthograficSize = 45;
private var refMarkerSize = 20;
private var markerSize = 20;

var gridBackgroundSize = new Vector2(100,100);
var border = 10;
var gridEntrySize : Vector2;

private var opacity = [0.1,0.2,0.5,1];

function Awake() {
	gridEntrySize = new Vector2((gridBackgroundSize.x/2),(gridBackgroundSize.y/3));
	enabled = false;
}

function OnGUI() {
	//for(var i:int=0; i<guideList.Count; i++)
		//DrawColorTable(guideList[i], opacityList[i], labelList[i]);
	
	// Reverse order has better overlapping (e.g. single items like spiders, mechs, weapons, drawn first)_
	for(var i:int=guideList.Count-1; i>=0; i--)
		DrawContentIndicator(guideList[i],labelList[i]);
}

function DrawColorTable(worldPos : Vector3, opacityIDs : SETTINGS[], label : String) {
	GUI.skin = guiSkin;
	
	var texture : Texture2D = new Texture2D(1,1);
	var color = Color.white;
	texture.SetPixel(1,1,color);
	texture.Apply();	
	GUI.skin.box.normal.background = texture;
	
	var gridScreenPos = camera.WorldToScreenPoint(worldPos);
	var gridGuiPos = GUIUtility.ScreenToGUIPoint(gridScreenPos);
	gridGuiPos.y = Screen.height - gridGuiPos.y; // For some reason, ScreenToGUIPoint doesnt flip the y axis as it should
	
	var offset : Vector2 = new Vector2(gridGuiPos.x-border-(gridBackgroundSize.x/2), gridGuiPos.y-(border*2)-(gridBackgroundSize.y/2));
	GUI.Box(Rect(offset.x, offset.y, gridBackgroundSize.x+(border*2), gridBackgroundSize.y+(border*3)),label);	
	
	var  center = new Vector2(gridGuiPos.x, gridGuiPos.y);
	
	/* Red, top-left */
	color = Color.red;
	color.a = opacity[opacityIDs[0]];
	texture.SetPixel(1,1,color);
	texture.Apply();
	GUI.skin.label.normal.background = texture;	
	GUI.Label(Rect(center.x-gridEntrySize.x, center.y-(gridEntrySize.y/2), gridEntrySize.x, -gridEntrySize.y),opacityIDs[0].ToString());
	
	/* Green, top-right */
	color = Color.green;
	color.a = opacity[opacityIDs[1]];
	texture.SetPixel(1,1,color);
	texture.Apply();
	GUI.skin.label.normal.background = texture;	
	GUI.Label(Rect(center.x, center.y-(gridEntrySize.y/2), gridEntrySize.x, -gridEntrySize.y),opacityIDs[1].ToString());
	
	/* Blue, mid-left */
	color = Color.blue;
	color.a = opacity[opacityIDs[2]];
	texture.SetPixel(1,1,color);
	texture.Apply();
	GUI.skin.label.normal.background = texture;	
	GUI.Label(Rect(center.x-gridEntrySize.x, center.y-(gridEntrySize.y/2), gridEntrySize.x, gridEntrySize.y),opacityIDs[2].ToString());
	
	/* Yellow, mid-right */
	color = Color.yellow;
	color.a = opacity[opacityIDs[3]];
	texture.SetPixel(1,1,color);
	texture.Apply();
	GUI.skin.label.normal.background = texture;	
	GUI.Label(Rect(center.x, center.y-(gridEntrySize.y/2), gridEntrySize.x, gridEntrySize.y),opacityIDs[3].ToString());
	
	/* Magenta, bottom-left */
	color = Color.magenta;
	color.a = opacity[opacityIDs[4]];
	texture.SetPixel(1,1,color);
	texture.Apply();
	GUI.skin.label.normal.background = texture;	
	GUI.Label(Rect(center.x-gridEntrySize.x, center.y+(gridEntrySize.y/2), gridEntrySize.x, gridEntrySize.y),opacityIDs[4].ToString());
	
	/* Cyan, bottom-right */
	color = Color.cyan;
	color.a = opacity[opacityIDs[5]];
	texture.SetPixel(1,1,color);
	texture.Apply();
	GUI.skin.label.normal.background = texture;	
	GUI.Label(Rect(center.x, center.y+(gridEntrySize.y/2), gridEntrySize.x, gridEntrySize.y),opacityIDs[5].ToString());

}


function DrawContentIndicator(worldPos : Vector3, label : String) {
	GUI.skin = guiSkin;
	var texture : Texture2D = new Texture2D(1,1);
	var color = Color.white;
	if(label.Equals("Spider")) {
		color = Color.red;
	}
	else if(label.Equals("BuzzBot")) {
		color = Color.green;
	}
	else if(label.Equals("Mech")) {
		color = Color.yellow;
	}
	else if(label.Equals("Health")) {
		color = Color.blue;
	}
	else if(label.Equals("Ammo")) {
		color = Color.magenta;
	}
	else if(label.Equals("Weapon")) {
		color = Color.cyan;
	}
	else
		Debug.LogError("Bad label in DrawContentIndicator");
		
	texture.SetPixel(1,1,color);
	texture.Apply();
	GUI.skin.label.normal.background = texture;
	
	var screenPos = camera.WorldToScreenPoint(worldPos);
	var guiPos = GUIUtility.ScreenToGUIPoint(screenPos);
	guiPos.y = Screen.height - guiPos.y; // For some reason, ScreenToGUIPoint doesnt flip the y axis as it should
	
	GUI.Label(Rect(guiPos.x-(markerSize/2),guiPos.y-(markerSize/2),markerSize,markerSize),"");		
}


function InitGuideList(parent : Transform) {
	guideList = new List.<Vector3>();
	opacityList = new List.<SETTINGS[]>();
	labelList = new List.<String>();
	for (var child in parent) {
		var childTrans = child as Transform;
    	if (childTrans.name.Contains("Room") && !childTrans.name.Contains("ShedRoom")) {
    		Debug.LogWarning(childTrans.name);
    		
    		var totalBounds = (childTrans.GetComponentInChildren(Collider) as Collider).bounds;
			var colliders = childTrans.GetComponentsInChildren(Collider);
			for (col in colliders) 
				totalBounds.Encapsulate((col as Collider).bounds);
			
			guideList.Add(totalBounds.center);
			
			// Get opacity values
			var roomManager : PCGGenericRoomManager = childTrans.GetComponentInChildren(PCGGenericRoomManager);																		
			opacityList.Add(roomManager.featureSettings);
			labelList.Add("Node ["+roomManager.treeDepth+","+roomManager.treeSibling+"]");
    	}
	}
}

function InitDetailedGuideList(parent : Transform) {
	guideList = new List.<Vector3>();
	labelList = new List.<String>(); 
	// orthographicSize is half of the height of the camera, this determines viewing angle and size	
	markerSize = (refOthograficSize/camera.orthographicSize)*refMarkerSize;
	
	for (var child in parent) {
		var childTrans = child as Transform;
    	if (childTrans.name.Contains("Room") && !childTrans.name.Contains("ShedRoom")) {
    		Debug.LogWarning(childTrans.name);
    		
    		for (var group in childTrans) {
    			var groupTrans = group as Transform;
    			if (groupTrans.name.Contains("GroupedBuzz")) {
    				for (var content in groupTrans) {
    					var contentTrans = content as Transform;
    					if (contentTrans.name.Equals("PCGBuzzBot")) {
    						guideList.Add(new Vector3(contentTrans.position.x,contentTrans.position.y,contentTrans.position.z));
    						labelList.Add("BuzzBot");
    					}
    				}
    			}
    			if (groupTrans.name.Contains("GroupedSpider")) {
    				for (var content in groupTrans) {
    					contentTrans = content as Transform;
    					if (contentTrans.name.Equals("PCGEnemySpawn")) {
    						guideList.Add(new Vector3(contentTrans.position.x,contentTrans.position.y,contentTrans.position.z));
    						labelList.Add("Spider");
    					}
    				}
    			}
    			if (groupTrans.name.Contains("GroupedMech")) {
    				for (var content in groupTrans) {
    					contentTrans = content as Transform;
    					if (contentTrans.name.Equals("PCGMech")) {
    						guideList.Add(new Vector3(contentTrans.position.x,contentTrans.position.y,contentTrans.position.z));
    						labelList.Add("Mech");
    					}
    				}
    			}
    			if (groupTrans.name.Contains("GroupedHealth")) {
    				for (var content in groupTrans) {
    					contentTrans = content as Transform;
    					if (contentTrans.name.Equals("PCGHealthBarrel")) {
    						guideList.Add(new Vector3(contentTrans.position.x,contentTrans.position.y,contentTrans.position.z));
    						labelList.Add("Health");
    					}
    				}
    			}
    			if (groupTrans.name.Contains("GroupedAmmo")) {
    				for (var content in groupTrans) {
    					contentTrans = content as Transform;
    					if (contentTrans.name.Equals("PCGAmmoBarrel")) {
    						guideList.Add(new Vector3(contentTrans.position.x,contentTrans.position.y,contentTrans.position.z));
    						labelList.Add("Ammo");
    					}
    				}
    			}
    			if (groupTrans.name.Contains("GroupedWeapons")) {
    				for (var content in groupTrans) {
    					contentTrans = content as Transform;
    					if (contentTrans.name.Equals("PCGWeaponCrate")) {
    						guideList.Add(new Vector3(contentTrans.position.x,contentTrans.position.y,contentTrans.position.z));
    						labelList.Add("Weapon");
    					}
    				}
    			}
    		}    	
    	}
	}
}