private var spiderHealth : Health;
private var spiderAttack : PCGSpiderAttackMoveController;

function Awake() {
	spiderHealth = GetComponent(Health);
	spiderAttack = gameObject.GetComponentInChildren(PCGSpiderAttackMoveController);
}

function InteractWithPlayer() {
	if(Input.GetAxis("Walk") && spiderAttack.enabled==false)
		spiderHealth.Kill();
}