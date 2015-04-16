#pragma strict

// Public member data
public var behaviourOnSpotted : MonoBehaviour;
public var soundOnSpotted : AudioClip;
public var behaviourOnLostTrack : MonoBehaviour;

// Private memeber data
private var character : Transform;
private var player : Transform;
private var playerMovement : PCGFreeMovementMotor;

function Awake () {
	character = transform;
	player = GameObject.FindWithTag ("Player").transform;
	playerMovement = player.GetComponent(PCGFreeMovementMotor);
}

function OnEnable () {
	behaviourOnLostTrack.enabled = true;
	behaviourOnSpotted.enabled = false;
}

function OnTriggerStay (other : Collider) {
	// Test to see if player is in radius, if they are walking or running,
	// and if they have already been spotted
	if (other.transform == player && !playerMovement.walking && !behaviourOnSpotted.enabled) {
		OnSpotted ();
	}
}

// Called from OnTriggerEnter above
function OnSpotted () {
	if (!behaviourOnSpotted.enabled) {
		behaviourOnSpotted.enabled = true;
		behaviourOnLostTrack.enabled = false;
		
		if (audio && soundOnSpotted) {
			audio.clip = soundOnSpotted;
			audio.Play ();
		}
	}
}

// Called from SpiderMoveAttackController
function OnLostTrack () {
	if (!behaviourOnLostTrack.enabled) {
		behaviourOnLostTrack.enabled = true;
		behaviourOnSpotted.enabled = false;
	}
}

// In this modification, this function only used by PCGSpiderAttackMoveController
// do detect when the spider has lost track of the player
function CanSeePlayer () : boolean {
	var playerDirection : Vector3 = (player.position - character.position);
	var hit : RaycastHit;
	Physics.Raycast (character.position, playerDirection, hit, playerDirection.magnitude);
	if (hit.collider && hit.collider.transform == player) {
		return true;
	}
	return false;
}

