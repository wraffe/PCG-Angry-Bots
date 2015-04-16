#pragma strict

// Do this on a seperate camera from the main camera so that it doesnt interfer with typical rendering
private var mapPreviewCamera : Camera;
var viewDistanceModifier : float = 0.5f;
@HideInInspector
var previewTextureArray : Texture2D[];

function Start() {
	mapPreviewCamera = gameObject.GetComponent(Camera);
	mapPreviewCamera.targetTexture = null;
	mapPreviewCamera.enabled = false;
	
	previewTextureArray = new Texture2D[8];
}

function CameraToTexture(textureIndex : int, cameraFocus : Transform) {		
	mapPreviewCamera.enabled = true;	
	
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

	// Establish the size of the texture and camera view
	var texSize = new Rect(0,0,256,256);
	previewTextureArray[textureIndex] = new Texture2D(texSize.width, texSize.height, TextureFormat.RGB24, false);
	mapPreviewCamera.pixelRect = texSize;	
	
	// Force the camera to render and save render buffer to a texture
	yield WaitForEndOfFrame();
	mapPreviewCamera.Render();	
	previewTextureArray[textureIndex].ReadPixels(texSize,0,0);
	previewTextureArray[textureIndex].Apply();	
	
	yield;
	mapPreviewCamera.enabled = false;
}