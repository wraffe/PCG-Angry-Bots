#pragma strict
private var mapManager : PCGTreeNEATMapManager;

var guiSkin : GUISkin;
var cursorImage : Texture;

@HideInInspector
var textureArray : RenderTexture[];
@HideInInspector
var textureArrayAlt : Texture2D[];

var boarderSize : Vector2 = new Vector2(1000,1000);
var imageSize : Vector2 = new Vector2(100,100);
var imageGap : float = 25;

@HideInInspector
var lastSelection : int = 0;
@HideInInspector
var randomGeneration : boolean = false;

function Start() {
	mapManager = gameObject.GetComponent(PCGTreeNEATMapManager);
	enabled = false;
}

function OnGUI() {
	if (SystemInfo.supportsRenderTextures) {
		if (textureArray.Length != 8)
			Debug.LogError("Invalid number of map preview texture in MapPreviewRenderer");
			
		Input.ResetInputAxes();
		if (Time.timeScale == 1)
			Time.timeScale = 0;
			
		GUI.skin = guiSkin;
			
		// Draw the background
		var boarderOffset = new Vector2((Screen.width/2)-(boarderSize.x/2), (Screen.height/2)-(boarderSize.y/2));
		GUI.Box(Rect(boarderOffset.x,boarderOffset.y,boarderSize.x,boarderSize.y), "Select a map");
		
		// Draw image textures
		// Starting top left, top row first	
		var imageOffset = new Vector2((Screen.width/2)-((imageSize.x*2)+imageGap+(imageGap/2)), (Screen.height/2)-(imageSize.y+(imageGap/2)));
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArray[0])) {
			lastSelection = 0;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		// Label above parent map
		if (!randomGeneration) {
			GUI.Label(Rect(imageOffset.x, imageOffset.y-25, 200, 25), "Last map played"); 
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArray[1])) {
			lastSelection = 1;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArray[2])) {
			lastSelection = 2;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArray[3])) {
			lastSelection = 3;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		// Now second row
		imageOffset.y += imageSize.y+imageGap;
		imageOffset.x = (Screen.width/2)-((imageSize.x*2)+imageGap+(imageGap/2));
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArray[4])) {
			lastSelection = 4;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArray[5])) {
			lastSelection = 5;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArray[6])) {
			lastSelection = 6;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArray[7])) {
			lastSelection = 7;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		// Draw cursor last to be on top
		var mousePos : Vector3 = Input.mousePosition;
	    var pos : Rect = Rect(mousePos.x,Screen.height - mousePos.y,cursorImage.width/3,cursorImage.height/3);
	    GUI.Label(pos,cursorImage);	
    }
    // Alternative for no render texture support. Precaution.
    else 
    {
    	if (textureArrayAlt.Length != 8)
			Debug.LogError("Invalid number of map preview texture in MapPreviewRenderer");
			
		Input.ResetInputAxes();
		if (Time.timeScale == 1)
			Time.timeScale = 0;
			
		GUI.skin = guiSkin;
			
		// Draw the background
		boarderOffset = new Vector2((Screen.width/2)-(boarderSize.x/2), (Screen.height/2)-(boarderSize.y/2));
		GUI.Box(Rect(boarderOffset.x,boarderOffset.y,boarderSize.x,boarderSize.y), "Select a map");
		
		// Draw image textures
		// Starting top left, top row first
		imageOffset = new Vector2((Screen.width/2)-((imageSize.x*2)+imageGap+(imageGap/2)), (Screen.height/2)-(imageSize.y+(imageGap/2)));
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArrayAlt[0])) {
			lastSelection = 0;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		// Label above parent map
		if (!randomGeneration) {
			GUI.Label(Rect(imageOffset.x, imageOffset.y-25, 200, 25), "Last map played"); 
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArrayAlt[1])) {
			lastSelection = 1;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArrayAlt[2])) {
			lastSelection = 2;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArrayAlt[3])) {
			lastSelection = 3;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		// Now second row
		imageOffset.y += imageSize.y+imageGap;
		imageOffset.x = (Screen.width/2)-((imageSize.x*2)+imageGap+(imageGap/2));
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArrayAlt[4])) {
			lastSelection = 4;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArrayAlt[5])) {
			lastSelection = 5;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArrayAlt[6])) {
			lastSelection = 6;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		imageOffset.x += imageSize.x+imageGap;
		if(GUI.Button(Rect(imageOffset.x,imageOffset.y,imageSize.x,imageSize.y),textureArrayAlt[7])) {
			lastSelection = 7;
			Time.timeScale = 1;
			mapManager.gameState = PCG_STATE.EvolveContent;
			enabled = false;
		}
		
		// Draw cursor last to be on top
		mousePos = Input.mousePosition;
	    pos = Rect(mousePos.x,Screen.height - mousePos.y,cursorImage.width/3,cursorImage.height/3);
	    GUI.Label(pos,cursorImage);	
    }
}