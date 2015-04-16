#pragma strict

@MenuItem ("Tools/Build Map From File")

static function MapFromFile () {
	// Get file
	var filePath : String = AssetDatabase.GetAssetPath(Selection.activeObject);
	if (filePath == null) { 
		EditorUtility.DisplayDialog("No File Selected", "Please select a file.", "Cancel"); 
		return; 
	}
	Debug.Log("File Path = "+filePath);
	
	// Get Map Geometry Builder
	var geometryBuilder = (GameObject.FindGameObjectWithTag("MapManager")).GetComponent(PCGTreeGeometryBuilder);
	if (geometryBuilder == null) {
		EditorUtility.DisplayDialog("Couldn't find a geometry builder in scene", "Please add a _MapBuilderAid game object", "Cancel"); 
		return; 
	}
	Debug.Log("geometryBuilder obtained");
	
	var sr = new System.IO.StreamReader(filePath);
    var fileContents = sr.ReadToEnd();
    
    var mapData : PCGTreeCandidate = StringToMap(fileContents, geometryBuilder); 
    
    
    var mapParent : GameObject = new GameObject("MapParent");
	
	var nodeQueue : Queue = new Queue();
	var transformQueue : Queue = new Queue();
	
	var startRoomT : Transform = Instantiate(geometryBuilder.startRoomPrefab.transform.parent,Vector3(0,0,0), Quaternion.identity);	
	var startRoomM : PCGGenericRoomManager = startRoomT.Find("_RoomManager").GetComponent(PCGGenericRoomManager);
	startRoomT.parent = mapParent.transform;
	DestroyImmediate(startRoomM.transform.Find("RoomBoundaries").gameObject); // RoomBoundaries destroyed to lessen collision detection during runtime
	
	var destroyList = new System.Collections.Generic.List.<GameObject>();
	
	EditorUtility.DisplayProgressBar("Its going to be slow.", "This is most likely NOT FROZEN, it just takes a while. Just leave it.", 0.5); 
	mapData.rootNode.RecursiveBuildForEditor(startRoomT, 0, mapData, mapParent, destroyList);
	
	for (var obj : GameObject in destroyList)
		UnityEngine.Object.DestroyImmediate(obj);
		
	geometryBuilder.currentStartRoom = startRoomM;
	
	EditorUtility.ClearProgressBar();
    
    Debug.Log("All Done!");	
}

static function StringToMap(fullString : String, geometryBuilder : PCGTreeGeometryBuilder) : PCGTreeCandidate {
	// Read the full string into a list of strings
	var stringArray : String[] = fullString.Split('\n'[0]);
	
	// Create a list of nodes, making each string into a node
	var  nodeList : System.Collections.Generic.List.<PCGTreeNode> = new System.Collections.Generic.List.<PCGTreeNode>();
	for (var nodeString : String in stringArray) {
		// If its has picked up a blank line at the end of the file, ignore it
		if (nodeString.Equals(""))
			break;
			
		var nodeData : String[] = nodeString.Split(','[0]);
		var contentId = parseInt(nodeData[0]);
		var geomId = parseInt(nodeData[1]);
		var inboudDoor = parseInt(nodeData[2]);
		var inbounCorridor = parseInt(nodeData[3]);
		var directPath = boolean.Parse(nodeData[4]);
		
		var newNode : PCGTreeNode = new PCGTreeNode(contentId,geomId,inboudDoor,inbounCorridor,directPath,geometryBuilder);
		nodeList.Add(newNode);
		
		// Attach each new node to it's parent
		var parentIndex = parseInt(nodeData[5]);
		var parentDoorId = parseInt(nodeData[6]);
		if(parentIndex >= 0)
			nodeList[parentIndex].AddChildAtDoor(parentDoorId,newNode);
	}
	
	// Create a candidate from the list with random branching rate and decay
	return (new PCGTreeCandidate(nodeList[0],0,0.5,0.5));
}



/*Undo.RegisterUndo (Terrain.activeTerrain.terrainData, "Heightmap From Texture");

	var terrain = Terrain.activeTerrain.terrainData;
	var w = heightmap.width;
	var h = heightmap.height;
	var w2 = terrain.heightmapWidth;
	var heightmapData = terrain.GetHeights(0, 0, w2, w2);
	var mapColors = heightmap.GetPixels();
	var map = new Color[w2 * w2];

	if (w2 != w || h != w) {
		// Resize using nearest-neighbor scaling if texture has no filtering
		if (heightmap.filterMode == FilterMode.Point) {
			var dx : float = parseFloat(w)/w2;
			var dy : float = parseFloat(h)/w2;
			for (y = 0; y < w2; y++) {
				if (y%20 == 0) {
					EditorUtility.DisplayProgressBar("Resize", "Calculating texture", Mathf.InverseLerp(0.0, w2, y));
				}
				var thisY = parseInt(dy*y)*w;
				var yw = y*w2;
				for (x = 0; x < w2; x++) {
					map[yw + x] = mapColors[thisY + dx*x];
				}
			}
		}
		// Otherwise resize using bilinear filtering
		else {
			var ratioX = 1.0/(parseFloat(w2)/(w-1));
			var ratioY = 1.0/(parseFloat(w2)/(h-1));
			for (y = 0; y < w2; y++) {
				if (y%20 == 0) {
					EditorUtility.DisplayProgressBar("Resize", "Calculating texture", Mathf.InverseLerp(0.0, w2, y));
				}
				var yy = Mathf.Floor(y*ratioY);
				var y1 = yy*w;
				var y2 = (yy+1)*w;
				yw = y*w2;
				for (x = 0; x < w2; x++) {
					var xx = Mathf.Floor(x*ratioX);

					var bl = mapColors[y1 + xx];
					var br = mapColors[y1 + xx+1]; 
					var tl = mapColors[y2 + xx];
					var tr = mapColors[y2 + xx+1];

					var xLerp = x*ratioX-xx;
					map[yw + x] = Color.Lerp(Color.Lerp(bl, br, xLerp), Color.Lerp(tl, tr, xLerp), y*ratioY-yy);
				}
			}
		}
		EditorUtility.ClearProgressBar();
	}
	else {
		// Use original if no resize is needed
		map = mapColors;
	}

	// Assign texture data to heightmap
	for (y = 0; y < w2; y++) {
		for (x = 0; x < w2; x++) {
			//heightmapData[y,x] = map[y*w2+x].grayscale;
			if (map[y*w2+x].grayscale <= 0.7)
				heightmapData[y,x] = 0;
			else
				heightmapData[y,x] = 1;
		}
	}
	terrain.SetHeights(0, 0, heightmapData);*/