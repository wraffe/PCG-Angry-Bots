public var electricArc : LineRenderer;
public var zapSound : AudioClip;
public var damagePerZap : float = 2.0f;
public var rateOfFire : float = 3.0f;
public var maxZapDist : float = 0.8f;

private var lastFireTime : float = -1;
private var audioSource : AudioSource;
private var zapNoise : Vector3 = Vector3.zero;

private var mainGun : Transform;
private var hitInfo : RaycastHit;

function Awake() {
	mainGun = transform.parent;
	audioSource = GetComponent.<AudioSource> ();
}

function DoElectricArc () {	
	if (electricArc.enabled)
		return;
		
	// 	Enough time from last fire
	if (Time.time > lastFireTime + 1 / rateOfFire) {
		lastFireTime = Time.time;
		
		// Play attack sound	
		audioSource.clip = zapSound;
		audioSource.Play ();
		
		// Show electric arc
		electricArc.enabled = true;
		
		zapNoise = transform.rotation * zapNoise;
		
		// Ray cast to see if an enemy is hit
		hitInfo = RaycastHit();
		// Measure from mainGun so if too close it still works
		Physics.Raycast(mainGun.transform.position, mainGun.forward, hitInfo, maxZapDist);
		
		var arcEndPos : Vector3 = electricArc.transform.position + (mainGun.forward*maxZapDist);
		
		if (hitInfo.transform) {
			// Get the health component of the target if any
			var targetHealth : Health = hitInfo.transform.GetComponent.<Health> ();
			if (targetHealth) {
				// Apply damage
				targetHealth.OnDamage (damagePerZap, -mainGun.forward);
			}			
		
			arcEndPos = hitInfo.transform.position;		
		}
		 
		
		// Offset  electric arc texture while it's visible
		var stopTime : float = Time.time + 0.1;
		while (Time.time < stopTime) {
			// Update line so it doesnt stick to a point in mid air but does stick to an enemy
			if (!hitInfo.transform)
				arcEndPos = electricArc.transform.position + (mainGun.forward*maxZapDist);
			electricArc.SetPosition (0, electricArc.transform.position);
			electricArc.SetPosition (1, arcEndPos + zapNoise);
			electricArc.sharedMaterial.mainTextureOffset.x = Random.value;
			yield;
		}
		
		// Hide electric arc
		electricArc.enabled = false;
	}
}