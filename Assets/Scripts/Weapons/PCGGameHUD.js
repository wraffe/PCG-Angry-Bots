// GameHUD: Platformer Tutorial Master GUI script.

// This script handles the in-game HUD, showing the lives, number of fuel cells remaining, etc.

var guiSkin : GUISkin;
var nativeVerticalResolution = 1200.0;

// the health 'pie chart' assets consist of six textures with alpha channels. Only one is ever shown:
var healthPieImages : Texture2D[];
var healthPieImageOffset = Vector2(0,0);

// the position of the health numerical value
var healthValueOffset = Vector2(90, 150);

// weapon image
var weaponImage : Texture2D;
var weaponImageOffset = Vector2(0,0);

// ammo count to be placed next to image of weapon
var ammoCountOffset = Vector2(165, 175);

private var playerHealth : Health;
private var maxHealth : float;
private var playerAmmo : PCGPlayerAmmo;

// Cache link to player's state management script for later use.
function Awake()
{
	playerHealth = GetComponent(Health);
	playerAmmo = GetComponentInChildren(PCGPlayerAmmo);

	if (!playerHealth)
		Debug.Error("No player health component found for GameHUD.");
	if (!playerAmmo)
		Debug.Error("No player ammo component found for GameHUD.");
		
	maxHealth = playerHealth.maxHealth;		
}

function OnGUI ()
{
	var ammoCount : int = playerAmmo.GetAmmoCount();	

	// Similarly, health needs to be clamped to the number of pie segments we can show.
	// We also need to check it's not negative, so we'll use the Mathf Clamp() function:
	var healthCount : int = playerHealth.health;
	var healthPieIndex : int = Mathf.CeilToInt((healthCount / maxHealth) * healthPieImages.Length);
	

	// Set up gui skin
	GUI.skin = guiSkin;

	// Our GUI is laid out for a 1920 x 1200 pixel display (16:10 aspect). The next line makes sure it rescales nicely to other resolutions.
	GUI.matrix = Matrix4x4.TRS (Vector3(0, 0, 0), Quaternion.identity, Vector3 (Screen.height / nativeVerticalResolution, Screen.height / nativeVerticalResolution, 1)); 

	// now for the pie chart. This is where a decent graphics package comes in handy to check relative sizes and offsets.
	if (healthPieIndex == 0)
		var pieImage = healthPieImages[0];
	else
		pieImage = healthPieImages[healthPieIndex-1];
	DrawImageBottomAligned( healthPieImageOffset, pieImage );
	
	// Displays health as an integer.	
	DrawLabelBottomAligned(healthValueOffset, healthCount.ToString() );	
	
	// Now it's the fuel cans' turn. We want this aligned to the lower-right corner of the screen:
	DrawImageBottomRightAligned( weaponImageOffset, weaponImage);

	DrawLabelBottomRightAligned(ammoCountOffset, ammoCount.ToString() );
}

function DrawImageBottomAligned (pos : Vector2, image : Texture2D)
{
	GUI.Label(Rect (pos.x, nativeVerticalResolution - image.height - pos.y, image.width, image.height), image);
}

function DrawLabelBottomAligned (pos : Vector2, text : String)
{
	GUI.Label(Rect (pos.x, nativeVerticalResolution - pos.y, 200, 200), text);
}

function DrawImageBottomRightAligned (pos : Vector2, image : Texture2D)
{
	var scaledResolutionWidth = nativeVerticalResolution / Screen.height * Screen.width;
	GUI.Label(Rect (scaledResolutionWidth - pos.x - image.width, nativeVerticalResolution - image.height - pos.y, image.width, image.height), image);
}

function DrawLabelBottomRightAligned (pos : Vector2, text : String)
{
	var scaledResolutionWidth = nativeVerticalResolution / Screen.height * Screen.width;
	GUI.Label(Rect (scaledResolutionWidth - pos.x, nativeVerticalResolution - pos.y, 200, 200), text);
}