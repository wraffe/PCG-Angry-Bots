@HideInInspector
var rateOfFire : float;
@HideInInspector
var damagePerShot : float;
@HideInInspector
var forcePerShot : float;

var ROF_Deviation : float = 5;
var damage_Deviation : float = 3;
var force_Deviation : float = 3;

var maxROF : float = 20;
var maxDamage : float = 15;
var maxForce : float = 8;

var weaponExamined : boolean;

@HideInInspector
var playersStartingWeapon : PCGPlayerAutoFire;

function Awake () {
	weaponExamined = false;
	playersStartingWeapon = GameObject.FindWithTag ("Player").GetComponentInChildren(PCGPlayerAutoFire);
	
	rateOfFire = playersStartingWeapon.rateOfFire + Mathf.Round(Random.Range(-ROF_Deviation, ROF_Deviation));
	if (rateOfFire <= 0)
		rateOfFire = 1;
	if (rateOfFire > maxROF)
		rateOfFire = maxROF;
	
	damagePerShot = playersStartingWeapon.damagePerShot + Mathf.Round(Random.Range(-damage_Deviation, damage_Deviation));
	if (damagePerShot <= 0)
		damagePerShot = 1;
	if (damagePerShot > maxDamage)
		damagePerShot = maxDamage;
		
	forcePerShot = playersStartingWeapon.forcePerShot + Mathf.Round(Random.Range(-force_Deviation, force_Deviation));
	if (forcePerShot <= 0)
		forcePerShot = 1;
	if (forcePerShot > maxForce)
		forcePerShot = maxForce;
}

function SwapPlayersWeapon () {
	playersStartingWeapon.rateOfFire = rateOfFire;
	playersStartingWeapon.damagePerShot = damagePerShot;
	playersStartingWeapon.forcePerShot = forcePerShot;
}