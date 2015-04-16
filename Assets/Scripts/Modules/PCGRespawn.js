#pragma strict

function OnSignal () {
	GameObject.FindWithTag("MapManager").GetComponent(PCGDeathGUI).enabled = true;
	
	ResetHealthOnAll ();
}

static function ResetHealthOnAll () {
	var healthObjects : Health[] = FindObjectsOfType (Health);
	for (var health : Health in healthObjects) {
		health.dead = false;
		health.health = health.maxHealth;
	}
}