
function OnTriggerEnter (hit : Collider) {
	if (Input.GetAxis("Interact"))
		hit.gameObject.SendMessage("InteractWithPlayer", SendMessageOptions.DontRequireReceiver);			
}