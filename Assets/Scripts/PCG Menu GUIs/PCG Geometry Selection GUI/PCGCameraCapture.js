#pragma strict

// Do this on a seperate camera from the main camera so that it doesnt interfer with typical rendering
private var mapPreviewCamera : Camera;
var viewDistanceModifier : float = 0.5f;
@HideInInspector
var previewTextureArray : RenderTexture[];

var colorMap : PCGContentColorMap;

function Start() {
	mapPreviewCamera = gameObject.GetComponent(Camera);
	previewTextureArray = new RenderTexture[8];
	mapPreviewCamera.targetTexture = null;
	mapPreviewCamera.gameObject.active = false;
}

function CameraToTexture(textureIndex : int, cameraFocus : Transform) {
	if (textureIndex < 0 || textureIndex >= previewTextureArray.Length)
		Debug.LogError("Texture Index is out of bounds in CameraToTexture() : " + textureIndex);

	// Prepare the targetTexture on the camera taking the shot
	previewTextureArray[textureIndex] = new RenderTexture(256,256,24);
	mapPreviewCamera.gameObject.active = true;	
	mapPreviewCamera.targetTexture = previewTextureArray[textureIndex];
	
	SetCameraPosition(cameraFocus);
	
	// Save the render buffer to the the texture asset
	//previewTextureArray[textureIndex].Create();
	// Force the camera to render, this will push its render to targetTexture
	mapPreviewCamera.Render();	

	// Disable the camera again. When targetTexture == null, camera defaults to rendering to screen
	// which may override the main camera.
	mapPreviewCamera.targetTexture = null;
	mapPreviewCamera.gameObject.active = false;
}

function CameraToScreenshot(fileName : String, cameraFocus : Transform) {
    var mainCam = GameObject.Find("Main Camera");
    mainCam.active = false;
    
    // For screenshots the camera object must be active and camera script enabled
	mapPreviewCamera.gameObject.active = true;
	mapPreviewCamera.enabled = true;
	
	SetCameraPosition(cameraFocus);
	yield WaitForSeconds(1);
	mapPreviewCamera.Render();
	
	// Take screen shot of map by itself
	Application.CaptureScreenshot("ScreenShots/"+fileName+".png");
	yield WaitForSeconds(2);
	
	// Take screenshot with color map overlaid
	//colorMap.InitGuideList(cameraFocus);
	colorMap.InitDetailedGuideList(cameraFocus);
	colorMap.enabled = true;
	yield WaitForSeconds(1);
	Application.CaptureScreenshot("ScreenShots/"+fileName+"_ColorTableMap.png");	
	yield WaitForSeconds(1);
	colorMap.enabled = false;
	
	mapPreviewCamera.enabled = false;
	mapPreviewCamera.gameObject.active = false;
	mainCam.active = true;
}


function SetCameraPosition(cameraFocus : Transform) {
	// Get the center position of the map
	var totalBounds = (cameraFocus.GetComponentInChildren(Collider) as Collider).bounds;
	var colliders = cameraFocus.GetComponentsInChildren(Collider);
	for (col in colliders) 
		totalBounds.Encapsulate((col as Collider).bounds);
	
	// Move the camera to the mapParent, reset its rotation, move it up and away, then focus on the mapParent
	mapPreviewCamera.transform.position = totalBounds.center;
	mapPreviewCamera.transform.rotation = Quaternion.identity;
	mapPreviewCamera.transform.Translate(Vector3.up*100); // Move away to capture near plane when map goes up
	mapPreviewCamera.transform.LookAt(totalBounds.center);
	// Field of view controlled by orthographicSize (google it)
	// Translating orthographic camera up-and-away only affects near/far planes, 
	// getting more in the x- and y-coordinates requires a change in orthographicSize
	mapPreviewCamera.orthographicSize = (Mathf.Max(totalBounds.size.x, totalBounds.size.z))*viewDistanceModifier;
}