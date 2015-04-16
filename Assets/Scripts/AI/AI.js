#pragma strict

// Public member data
public var behaviourOnSpotted : MonoBehaviour;
public var soundOnSpotted : AudioClip;
public var behaviourOnLostTrack : MonoBehaviour;

// Private memeber data
private var character : Transform;
private var player : Transform;
private var insideInterestArea : boolean = true;

function Awake () {
	character = transform;
	player = GameObject.FindWithTag ("Player").transform;
}

function OnEnable () {
	if (transform.parent.name != "PCGMech")
		behaviourOnLostTrack.enabled = true;
	behaviourOnSpotted.enabled = false;
}

function OnTriggerEnter (other : Collider) {
	if (other.transform == player && CanSeePlayer ()) {
		OnSpotted ();
	}
}

// These functions for mech PatrolRoute.js
function OnEnterInterestArea () {
	insideInterestArea = true;
}

function OnExitInterestArea () {
	Debug.Log("ExitInterestArea");
	insideInterestArea = false;
	OnLostTrack ();
}

function OnSpotted () {
	// Inside interest area true by default. Only used by mech, not spider
	if (!insideInterestArea)
		return;
	if (!behaviourOnSpotted.enabled) {
		behaviourOnSpotted.enabled = true;
		behaviourOnLostTrack.enabled = false;
		
		if (audio && soundOnSpotted) {
			audio.clip = soundOnSpotted;
			audio.Play ();
		}
	}
}

function OnLostTrack () {

	if (!behaviourOnLostTrack.enabled) {
		behaviourOnLostTrack.enabled = true;
		behaviourOnSpotted.enabled = false;
	}
}

function CanSeePlayer () : boolean {
	var playerDirection : Vector3 = (player.position - character.position);
	var hit : RaycastHit;
	Physics.Raycast (character.position, playerDirection, hit, playerDirection.magnitude);
	if (hit.collider && hit.collider.transform == player) {
		return true;
	}
	return false;
}
